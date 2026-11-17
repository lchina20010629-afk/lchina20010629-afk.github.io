/**
 * Bootstrap command: Initialize vault with password verifier
 */

import { join } from 'path';
import { mkdir } from 'fs/promises';
import { readPassword } from '../lib/password.js';
import { createPasswordVerifier, verifyPassword } from '../lib/crypto.js';
import { loadManifest, createManifest, saveManifestAtomic } from '../lib/manifest.js';

interface BootstrapOptions {
  output: string;
  stdinPassword?: boolean;
}

export async function bootstrap(options: BootstrapOptions): Promise<void> {
  try {
    console.log('\n🔐 Bootstrapping vault...\n');
    
    // Read password securely
    const password = await readPassword(!!options.stdinPassword);
    
    // Ensure output directory exists
    await mkdir(options.output, { recursive: true });
    
    const manifestPath = join(options.output, 'manifest.json');
    const existingManifest = await loadManifest(manifestPath);
    
    if (existingManifest) {
      // Check if it's an empty placeholder or real vault
      const isEmpty = !existingManifest.vault.verifier.salt || 
                      existingManifest.vault.verifier.salt === '' ||
                      !existingManifest.vault.verifier.verifier ||
                      existingManifest.vault.verifier.verifier === '';
      
      if (isEmpty) {
        // Empty placeholder - initialize it
        console.log('Found empty placeholder vault - initializing...');
        const verifier = createPasswordVerifier(password);
        existingManifest.vault.verifier = verifier;
        existingManifest.vault.createdAt = new Date().toISOString();
        await saveManifestAtomic(manifestPath, existingManifest);
        console.log('✅ Empty vault initialized with password verifier');
        return;
      }
      
      // Real vault exists - verify password
      console.log('Existing vault found - verifying password...');
      
      const isValid = verifyPassword(password, existingManifest.vault.verifier);
      
      if (!isValid) {
        console.error('✗ ERROR: Incorrect password');
        console.error('Vault NOT modified - all existing data preserved');
        process.exit(1);
      }
      
      console.log('✓ Password verified');
      console.log(`✓ Vault already initialized with ${existingManifest.entries.length} entries`);
      console.log('No changes made');
      return;
    }
    
    // Create new manifest with password verifier
    console.log('Creating new vault...');
    const verifier = createPasswordVerifier(password);
    const manifest = createManifest(verifier);
    
    // Save atomically
    await saveManifestAtomic(manifestPath, manifest);
    
    console.log('✅ Vault initialized successfully!');
    console.log(`   Location: ${manifestPath}`);
    console.log(`   Entries: 0`);
    console.log(`   Created: ${manifest.vault.createdAt}`);
    
  } catch (err) {
    console.error('\n✗ Bootstrap failed:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
