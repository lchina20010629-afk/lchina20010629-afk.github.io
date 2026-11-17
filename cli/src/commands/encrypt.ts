/**
 * Encrypt command: Encrypt entry and update manifest
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, basename, extname } from 'path';
import { randomBytes } from 'crypto';
import { readPassword } from '../lib/password.js';
import { encrypt as encryptData, verifyPassword } from '../lib/crypto.js';
import { loadManifest, createManifest, saveManifestAtomic, upsertEntry, ManifestEntry } from '../lib/manifest.js';
import { validateDate, validatePeriod, validateCourseEntry, DiaryEntry, CourseEntry, ReviewEntry } from '../lib/validation.js';
import { stripImageMetadata, getMimeType } from '../lib/images.js';

interface EncryptOptions {
  type: 'diary' | 'course' | 'weekly' | 'monthly' | 'yearly';
  date?: string;
  period?: string;
  input: string;
  output: string;
  stdinPassword?: boolean;
}

export async function encrypt(options: EncryptOptions): Promise<void> {
  try {
    console.log(`\n🔐 Encrypting ${options.type} entry...\n`);
    
    // Validate date or period
    const dateOrPeriod = options.date || options.period;
    if (!dateOrPeriod) {
      throw new Error('Must provide --date (for diary/course) or --period (for weekly/monthly/yearly)');
    }
    
    if (options.type === 'diary' || options.type === 'course') {
      if (!options.date) throw new Error(`${options.type} requires --date`);
      validateDate(options.date);
    } else {
      if (!options.period) throw new Error(`${options.type} requires --period`);
      validatePeriod(options.period, options.type);
    }
    
    // Read and validate input
    const inputData = JSON.parse(await readFile(options.input, 'utf-8'));
    
    if (options.type === 'course') {
      validateCourseEntry(inputData);
    }
    
    // Read password securely
    const password = await readPassword(!!options.stdinPassword);
    
    // Ensure output directories exist
    await mkdir(options.output, { recursive: true });
    const encryptedDir = join(options.output, 'encrypted');
    await mkdir(encryptedDir, { recursive: true });
    
    // Load or create manifest
    const manifestPath = join(options.output, 'manifest.json');
    let manifest = await loadManifest(manifestPath);
    
    if (manifest) {
      // Verify password before allowing operations
      const isValid = verifyPassword(password, manifest.vault.verifier);
      if (!isValid) {
        console.error('✗ ERROR: Incorrect password');
        console.error('Operation aborted - vault NOT modified');
        process.exit(1);
      }
    } else {
      // Create new manifest
      console.log('Creating new manifest...');
      const { createPasswordVerifier } = await import('../lib/crypto');
      const verifier = createPasswordVerifier(password);
      manifest = createManifest(verifier);
    }
    
    // Process images (if any)
    const attachments: Array<{ id: string; encryptedPath: string; type: string }> = [];
    
    if (inputData.images && Array.isArray(inputData.images) && inputData.images.length > 0) {
      console.log(`📷 Processing ${inputData.images.length} image(s)...\n`);
      
      for (const imagePath of inputData.images) {
        try {
          // Strip metadata
          console.log(`   Stripping metadata: ${basename(imagePath)}`);
          const cleanImage = await stripImageMetadata(imagePath);
          
          // Encrypt
          const encryptedImage = await encryptData(cleanImage, password);
          
          // Generate image ID and save
          // FIXED: Use consistent data/ prefix for HTTP deployment
          const imageId = `img_${Date.now()}_${randomBytes(4).toString('hex')}`;
          const ext = extname(imagePath);
          const encryptedFileName = `${imageId}${ext}.enc`;
          
          // Save in output root (will be deployed to data/)
          const encryptedPath = join(options.output, encryptedFileName);
          await writeFile(encryptedPath, JSON.stringify(encryptedImage), 'utf-8');
          
          attachments.push({
            id: imageId,
            encryptedPath: `data/${encryptedFileName}`, // Browser loads from /data/
            type: getMimeType(ext),
          });
          
          console.log(`   ✓ Encrypted: ${encryptedFileName}`);
        } catch (err) {
          console.error(`   ✗ Failed to process ${basename(imagePath)}:`, err);
          throw err;
        }
      }
      
      console.log('');
    }
    
    // Create entry data with images as references
    const entryData: any = { ...inputData };
    
    if (attachments.length > 0) {
      entryData.images = attachments.map(a => ({
        id: a.id,
        encryptedData: `REFERENCE:${a.encryptedPath}`,
        type: a.type,
      }));
    }
    
    // Encrypt entry
    const entryJson = JSON.stringify(entryData);
    const encrypted = await encryptData(Buffer.from(entryJson, 'utf-8'), password);
    
    // Write encrypted entry
    const entryId = `${options.type}-${dateOrPeriod}`;
    const entryFileName = `${entryId}.enc`;
    const entryPath = join(encryptedDir, entryFileName);
    await writeFile(entryPath, JSON.stringify(encrypted), 'utf-8');
    
    console.log(`✓ Entry encrypted: encrypted/${entryFileName}`);
    
    // Upsert entry in manifest
    const entry: ManifestEntry = {
      id: entryId,
      date: dateOrPeriod,
      type: options.type,
      encryptedPath: `encrypted/${entryFileName}`,
      attachments: attachments.length > 0 ? attachments : undefined,
      publishedAt: new Date().toISOString(),
    };
    
    const isUpdate = manifest.entries.some(e => e.id === entryId);
    upsertEntry(manifest, entry);
    
    console.log(isUpdate ? '🔄 Updated existing entry' : '➕ Added new entry');
    
    // Save manifest atomically
    await saveManifestAtomic(manifestPath, manifest);
    
    console.log('\n✅ Done!');
    console.log(`   Manifest: ${manifestPath}`);
    console.log(`   Total entries: ${manifest.entries.length}`);
    
  } catch (err) {
    console.error('\n✗ Encryption failed:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
