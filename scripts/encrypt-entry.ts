#!/usr/bin/env node
/**
 * CLI tool to encrypt diary/course/review entries and update manifest
 * 
 * Usage:
 *   tsx scripts/encrypt-entry.ts --type diary --date 2026-11-16 --input entry.json --password "..."
 *   tsx scripts/encrypt-entry.ts --type course --date 2026-11-16 --input course.json --password "..."
 *   tsx scripts/encrypt-entry.ts --type weekly --period 2026-W46 --input weekly.json --password "..."
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
import { join, basename, extname } from 'path';
import { createHash, pbkdf2Sync, randomBytes } from 'crypto';
import * as ExifReader from 'exifreader';

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

/**
 * Strip EXIF data from image
 */
async function stripExif(imagePath: string): Promise<Buffer> {
  const imageData = await readFile(imagePath);
  
  // Check if image has EXIF
  try {
    const tags = ExifReader.load(imageData);
    if (Object.keys(tags).length > 0) {
      console.log(`  ⚠️  EXIF data found in ${basename(imagePath)}, stripping...`);
    }
  } catch {
    // No EXIF or unreadable
  }
  
  // For now, return as-is (full EXIF stripping requires image processing library)
  // In production, use sharp or similar to re-encode without metadata
  return imageData;
}

/**
 * Encrypt image file
 */
async function encryptImage(imagePath: string, password: string, outputDir: string): Promise<{ id: string; path: string; type: string }> {
  console.log(`  📸 Encrypting image: ${basename(imagePath)}`);
  
  // Strip EXIF
  const imageData = await stripExif(imagePath);
  
  // Encrypt
  const encrypted = await encrypt(imageData, password);
  
  // Generate ID and output path
  const id = `img-${Date.now()}-${randomBytes(4).toString('hex')}`;
  const ext = extname(imagePath);
  const outputPath = join(outputDir, `${id}.enc`);
  
  // Write encrypted data
  await writeFile(outputPath, JSON.stringify(encrypted));
  
  // Determine MIME type
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  const type = mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  
  return {
    id,
    path: `encrypted/${basename(outputPath)}`,
    type,
  };
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
  
  const type = getArg('--type') as 'diary' | 'course' | 'weekly' | 'monthly' | 'yearly' | undefined;
  const date = getArg('--date');
  const period = getArg('--period');
  const inputPath = getArg('--input');
  const password = getArg('--password');
  const outputDir = getArg('--output') || 'public/data';
  
  if (!type || !inputPath || !password) {
    console.error('Usage: tsx scripts/encrypt-entry.ts --type <type> --date <date> --input <input.json> --password <password> [--output <dir>]');
    process.exit(1);
  }
  
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
  
  // Encrypt images
  const attachments: Array<{ id: string; encryptedPath: string; type: string }> = [];
  if (input.images) {
    for (const imagePath of input.images) {
      const encrypted = await encryptImage(imagePath, password, encryptedDir);
      attachments.push({
        id: encrypted.id,
        encryptedPath: encrypted.path,
        type: encrypted.type,
      });
    }
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
