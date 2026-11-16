#!/usr/bin/env node
/**
 * CLI 脚本：加密并发布条目
 * 
 * 用于父自动化流程加密日记、课程记录、总结等内容
 * 
 * 使用方法：
 *   VAULT_PASSWORD=xxx node scripts/encrypt-entry.ts \
 *     --type diary \
 *     --date 2026-11-16 \
 *     --input entry.json \
 *     --images img1.jpg,img2.jpg
 * 
 * 或通过 stdin 传递密码：
 *   echo "password" | node scripts/encrypt-entry.ts --type diary --input entry.json
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { createInterface } from 'readline';
import { stdin, argv, env, exit } from 'process';
import { webcrypto } from 'crypto';

// Polyfill for Node.js crypto
if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}

// Import crypto functions (in real scenario, these would be compiled from src/lib/crypto.ts)
// For this implementation, we'll inline simplified versions

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

interface ManifestEntry {
  id: string;
  type: 'diary' | 'course' | 'weekly' | 'monthly' | 'yearly';
  date: string;
  period?: string;
  encryptedPath: string;
  encryptedImages?: string[];
  created: string;
  modified: string;
  cryptoVersion: 'v1';
  status?: 'published';
}

interface Manifest {
  version: string;
  entries: ManifestEntry[];
  verifier?: any;
}

const ITERATIONS = 600000;
const DATA_DIR = join(process.cwd(), 'data');
const MANIFEST_PATH = join(DATA_DIR, 'manifest.json');

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Commented out - not used in this script but kept for reference
// function hexToBuffer(hex: string): ArrayBuffer {
//   const bytes = new Uint8Array(hex.length / 2);
//   for (let i = 0; i < hex.length; i += 2) {
//     bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
//   }
//   return bytes.buffer;
// }

function generateRandomBytes(length: number): ArrayBuffer {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes.buffer;
}

async function deriveKey(password: string, salt: ArrayBuffer): Promise<webcrypto.CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptData(plaintext: string | ArrayBuffer, password: string): Promise<EncryptedEnvelope> {
  const salt = generateRandomBytes(32);
  const iv = generateRandomBytes(12);
  const key = await deriveKey(password, salt);

  let plaintextBuffer: ArrayBuffer;
  if (typeof plaintext === 'string') {
    const encoder = new TextEncoder();
    plaintextBuffer = encoder.encode(plaintext);
  } else {
    plaintextBuffer = plaintext;
  }

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv, tagLength: 128 },
    key,
    plaintextBuffer
  );

  const ciphertextBytes = new Uint8Array(ciphertext);
  const actualCiphertext = ciphertextBytes.slice(0, -16);
  const authTag = ciphertextBytes.slice(-16);

  return {
    version: 'v1',
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    salt: bufferToHex(salt),
    iv: bufferToHex(iv),
    iterations: ITERATIONS,
    ciphertext: bufferToHex(actualCiphertext),
    authTag: bufferToHex(authTag),
  };
}

async function readPassword(): Promise<string> {
  // Try environment variable first
  if (env.VAULT_PASSWORD) {
    return env.VAULT_PASSWORD;
  }

  // Try stdin
  if (!stdin.isTTY) {
    const rl = createInterface({ input: stdin });
    for await (const line of rl) {
      return line.trim();
    }
  }

  console.error('错误：未提供密码');
  console.error('请通过环境变量 VAULT_PASSWORD 或 stdin 提供密码');
  exit(1);
}

async function loadManifest(): Promise<Manifest> {
  try {
    const content = await readFile(MANIFEST_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {
      version: '1.0.0',
      entries: [],
    };
  }
}

async function saveManifest(manifest: Manifest): Promise<void> {
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
}

async function main() {
  const args = {
    type: '',
    date: '',
    period: '',
    input: '',
    images: '',
  };

  // Parse arguments
  for (let i = 2; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    const value = argv[i + 1];
    if (key in args) {
      (args as any)[key] = value;
    }
  }

  if (!args.type || !args.input) {
    console.error('用法: node encrypt-entry.ts --type <type> --input <file> [--date <date>] [--period <period>] [--images <files>]');
    exit(1);
  }

  // Read password
  const password = await readPassword();

  // Read input file
  const inputContent = await readFile(args.input, 'utf-8');
  const inputData = JSON.parse(inputContent);

  // Encrypt entry
  const encrypted = await encryptData(JSON.stringify(inputData), password);

  // Determine output path
  const timestamp = new Date().toISOString();
  const id = inputData.id || `${args.type}-${args.date || args.period}-${Date.now()}`;
  
  let subdir: string;
  let filename: string;
  
  if (args.type === 'weekly' || args.type === 'monthly' || args.type === 'yearly') {
    subdir = 'reviews';
    filename = `${args.type}-${args.period}.enc`;
  } else {
    subdir = args.type === 'diary' ? 'diary' : 'courses';
    filename = `${args.date}.enc`;
  }

  const outputPath = join(DATA_DIR, 'encrypted', subdir, filename);
  await writeFile(outputPath, JSON.stringify(encrypted, null, 2), 'utf-8');

  console.log(`✓ 加密完成: ${outputPath}`);

  // Update manifest
  const manifest = await loadManifest();
  const existingIndex = manifest.entries.findIndex(
    e => e.type === args.type && (e.date === args.date || e.period === args.period)
  );

  const entry: ManifestEntry = {
    id,
    type: args.type as any,
    date: args.date,
    period: args.period,
    encryptedPath: `encrypted/${subdir}/${filename}`,
    created: existingIndex >= 0 ? manifest.entries[existingIndex].created : timestamp,
    modified: timestamp,
    cryptoVersion: 'v1',
    status: 'published',
  };

  if (existingIndex >= 0) {
    manifest.entries[existingIndex] = entry;
    console.log(`✓ 更新已存在的条目`);
  } else {
    manifest.entries.push(entry);
    console.log(`✓ 添加新条目`);
  }

  await saveManifest(manifest);
  console.log(`✓ 更新清单: ${MANIFEST_PATH}`);
  console.log(`✓ 完成！`);
}

main().catch(err => {
  console.error('错误:', err.message);
  exit(1);
});
