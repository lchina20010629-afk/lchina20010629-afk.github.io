#!/usr/bin/env node
/**
 * CLI tool to encrypt diary/course/review entries and update manifest
 * 
 * Usage:
 *   VAULT_PASSWORD="..." tsx scripts/encrypt-entry.ts --type diary --date 2026-11-16 --input entry.json
 *   echo "password" | tsx scripts/encrypt-entry.ts --type course --date 2026-11-16 --input course.json --stdin-password
 *   tsx scripts/encrypt-entry.ts --type weekly --period 2026-W46 --input weekly.json
 * 
 * Password sources (in order of precedence):
 *   1. --stdin-password flag: Read from stdin (secure for piping)
 *   2. VAULT_PASSWORD environment variable
 * 
 * Input JSON format:
 * {
 *   "title": "...",
 *   "content": "...",
 *   "tags": ["..."],
 *   "mood": "...",  // diary only
 *   "weather": "...",  // diary only
 *   "images": ["path/to/image.jpg"],  // optional
 *   "progress": 50,  // course only
 *   "category": "..."  // course only
 * }
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, basename } from 'path';
import { createHash, pbkdf2Sync, randomBytes } from 'crypto';

interface InputEntry {
  title: string;
  content: string;
  tags?: string[];
  mood?: string;
  weather?: string;
  images?: string[];
  progress?: number;
  category?: string;
}

interface EncryptedEnvelope {
  version: 'v1';
  algorithm: 'AES-256-GCM';
  kdf: 'PBKDF2-SHA256';
  salt: string;
  iv: string;
  iterations: number;
  ciphertext: string;
  authTag: string;
}

interface Manifest {
  version: '1.0.0';
  vault: {
    version: '1.0.0';
    verifier: {
      salt: string;
      verifier: string;
      iterations: number;
    };
    createdAt: string;
    description?: string;
  };
  entries: Array<{
    id: string;
    date: string;
    type: 'diary' | 'course' | 'weekly' | 'monthly' | 'yearly';
    encryptedPath: string;
    attachments?: Array<{
      id: string;
      encryptedPath: string;
      type: string;
    }>;
    publishedAt: string;
  }>;
  generatedAt: string;
}

const ITERATIONS = 600000;

/**
 * Derive encryption key from password
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256');
}

/**
 * Create password verifier
 */
function createPasswordVerifier(password: string): { salt: string; verifier: string; iterations: number } {
  const salt = randomBytes(32);
  const key = deriveKey(password, salt);
  const verifier = createHash('sha256').update(key).digest('hex');
  
  return {
    salt: salt.toString('hex'),
    verifier,
    iterations: ITERATIONS,
  };
}

/**
 * Encrypt data with AES-256-GCM
 */
async function encrypt(data: Buffer, password: string): Promise<EncryptedEnvelope> {
  const { webcrypto } = await import('crypto');
  
  const salt = randomBytes(32);
  const iv = randomBytes(12);
  const key = deriveKey(password, salt);
  
  const cryptoKey = await webcrypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const encrypted = await webcrypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  
  const encryptedArray = new Uint8Array(encrypted);
  const ciphertext = encryptedArray.slice(0, -16);
  const authTag = encryptedArray.slice(-16);
  
  return {
    version: 'v1',
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    iterations: ITERATIONS,
    ciphertext: Buffer.from(ciphertext).toString('hex'),
    authTag: Buffer.from(authTag).toString('hex'),
  };
}

// EXIF stripping not yet implemented - images currently disabled
// TODO: Implement with sharp or similar library for safe re-encoding

/**
 * Encrypt image file (currently disabled - see main())
 * TODO: Implement proper EXIF/metadata stripping before re-enabling
 */
// async function encryptImage(imagePath: string, password: string, outputDir: string): Promise<{ id: string; path: string; type: string }> {
//   console.log(`  📸 Encrypting image: ${basename(imagePath)}`);
//   
//   // Strip EXIF
//   const imageData = await stripExif(imagePath);
//   
//   // Encrypt
//   const encrypted = await encrypt(imageData, password);
//   
//   // Generate ID and output path
//   const id = `img-${Date.now()}-${randomBytes(4).toString('hex')}`;
//   const ext = extname(imagePath);
//   const outputPath = join(outputDir, `${id}.enc`);
//   
//   // Write encrypted data
//   await writeFile(outputPath, JSON.stringify(encrypted));
//   
//   // Determine MIME type
//   const mimeTypes: Record<string, string> = {
//     '.jpg': 'image/jpeg',
//     '.jpeg': 'image/jpeg',
//     '.png': 'image/png',
//     '.gif': 'image/gif',
//     '.webp': 'image/webp',
//   };
//   const type = mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
//   
//   return {
//     id,
//     path: `encrypted/${basename(outputPath)}`,
//     type,
//   };
// }

/**
 * Read password securely from stdin or environment
 */
async function readPassword(useStdin: boolean): Promise<string> {
  if (useStdin) {
    // Read from stdin
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    const password = Buffer.concat(chunks).toString('utf-8').trim();
    if (!password) {
      throw new Error('No password provided on stdin');
    }
    return password;
  }
  
  // Read from environment variable
  const password = process.env.VAULT_PASSWORD;
  if (!password) {
    throw new Error('Password required: set VAULT_PASSWORD environment variable or use --stdin-password');
  }
  return password;
}

/**
 * Main CLI
 */
async function main() {
  const args = process.argv.slice(2);
  const getArg = (name: string): string | undefined => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const hasFlag = (name: string): boolean => args.includes(name);
  
  const type = getArg('--type') as 'diary' | 'course' | 'weekly' | 'monthly' | 'yearly' | undefined;
  const date = getArg('--date');
  const period = getArg('--period');
  const inputPath = getArg('--input');
  const outputDir = getArg('--output') || 'public/data';
  const useStdin = hasFlag('--stdin-password');
  
  if (!type || !inputPath) {
    console.error('Usage: VAULT_PASSWORD="..." tsx scripts/encrypt-entry.ts --type <type> --date <date> --input <input.json> [--output <dir>]');
    console.error('   or: echo "password" | tsx scripts/encrypt-entry.ts ... --stdin-password');
    process.exit(1);
  }
  
  const password = await readPassword(useStdin);
  
  if (type !== 'diary' && type !== 'course' && type !== 'weekly' && type !== 'monthly' && type !== 'yearly') {
    console.error('Invalid type. Must be: diary, course, weekly, monthly, or yearly');
    process.exit(1);
  }
  
  const dateOrPeriod = date || period;
  if (!dateOrPeriod) {
    console.error('Must provide --date (for diary/course) or --period (for weekly/monthly/yearly)');
    process.exit(1);
  }
  
  console.log(`\n🔐 Encrypting ${type} entry: ${dateOrPeriod}`);
  
  // Read input
  const input: InputEntry = JSON.parse(await readFile(inputPath, 'utf-8'));
  
  // Create output directories
  const encryptedDir = join(outputDir, 'encrypted');
  await mkdir(encryptedDir, { recursive: true });
  
  // Image publishing currently disabled - EXIF stripping not yet implemented
  // TODO: Implement proper EXIF/metadata stripping with image re-encoding before enabling
  const attachments: Array<{ id: string; encryptedPath: string; type: string }> = [];
  if (input.images && input.images.length > 0) {
    console.error('\n❌ ERROR: Image publishing is currently disabled.');
    console.error('   EXIF/metadata stripping must be implemented before publishing images.');
    console.error('   Remove "images" field from input JSON or implement safe stripping.');
    process.exit(1);
  }
  
  // Create entry envelope
  const entryData = {
    title: input.title,
    content: input.content,
    tags: input.tags || [],
    mood: input.mood,
    weather: input.weather,
    progress: input.progress,
    category: input.category,
    images: attachments.map(a => ({
      id: a.id,
      encryptedData: `REFERENCE:${a.encryptedPath}`,
      type: a.type,
    })),
  };
  
  const entryJson = JSON.stringify(entryData);
  const encrypted = await encrypt(Buffer.from(entryJson, 'utf-8'), password);
  
  // Write encrypted entry
  const entryId = `${type}-${dateOrPeriod}`;
  const entryPath = join(encryptedDir, `${entryId}.enc`);
  await writeFile(entryPath, JSON.stringify(encrypted));
  
  console.log(`  ✅ Entry encrypted: encrypted/${basename(entryPath)}`);
  
  // Load or create manifest
  const manifestPath = join(outputDir, 'manifest.json');
  let manifest: Manifest;
  
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
  } catch {
    console.log('  📝 Creating new manifest');
    const verifier = createPasswordVerifier(password);
    manifest = {
      version: '1.0.0',
      vault: {
        version: '1.0.0',
        verifier,
        createdAt: new Date().toISOString(),
        description: 'Published encrypted entries',
      },
      entries: [],
      generatedAt: new Date().toISOString(),
    };
  }
  
  // Add or update entry in manifest
  const existingIndex = manifest.entries.findIndex(e => e.id === entryId);
  const entryMetadata = {
    id: entryId,
    date: dateOrPeriod,
    type,
    encryptedPath: `encrypted/${basename(entryPath)}`,
    attachments: attachments.length > 0 ? attachments : undefined,
    publishedAt: new Date().toISOString(),
  };
  
  if (existingIndex >= 0) {
    manifest.entries[existingIndex] = entryMetadata;
    console.log(`  🔄 Updated existing entry in manifest`);
  } else {
    manifest.entries.push(entryMetadata);
    console.log(`  ➕ Added new entry to manifest`);
  }
  
  manifest.generatedAt = new Date().toISOString();
  
  // Write manifest
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  
  console.log(`\n✅ Done! Manifest: ${manifestPath}`);
  console.log(`   Entries: ${manifest.entries.length}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
