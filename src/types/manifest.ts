/**
 * Public manifest types for published encrypted entries
 * NO plaintext content - only metadata for discovery
 */

export interface PublicVaultConfig {
  version: '1.0.0';
  // Password verifier for published vault (same as local vault structure)
  verifier: {
    salt: string;
    verifier: string;
    iterations: number;
  };
  // Metadata only
  createdAt: string;
  description?: string;
}

export interface PublicEntryMetadata {
  // Entry identifier
  id: string;
  date: string; // YYYY-MM-DD for diary entries
  
  // Entry type
  type: 'diary' | 'course' | 'weekly' | 'monthly' | 'yearly';
  
  // Encrypted content file path (relative to manifest, must be safe)
  encryptedPath: string;
  
  // Encrypted attachments (images)
  attachments?: Array<{
    id: string;
    encryptedPath: string;
    type: string; // MIME type
  }>;
  
  // Publication metadata
  publishedAt: string;
  
  // NO title, content, tags, or other plaintext here
}

export interface PublicManifest {
  version: '1.0.0';
  
  // Vault config for published content
  vault: PublicVaultConfig;
  
  // Entries metadata (NO plaintext content)
  entries: PublicEntryMetadata[];
  
  // Generation timestamp
  generatedAt: string;
}

/**
 * Validate manifest structure and paths
 */
export function validateManifest(manifest: unknown): manifest is PublicManifest {
  if (!manifest || typeof manifest !== 'object') return false;
  
  const m = manifest as Partial<PublicManifest>;
  
  // Version check
  if (m.version !== '1.0.0') return false;
  
  // Vault config
  if (!m.vault?.verifier?.salt || !m.vault?.verifier?.verifier || !m.vault?.verifier?.iterations) {
    return false;
  }
  
  // Entries array
  if (!Array.isArray(m.entries)) return false;
  
  for (const entry of m.entries) {
    // Required fields
    if (!entry.id || !entry.date || !entry.type || !entry.encryptedPath) {
      return false;
    }
    
    // Type validation
    if (!['diary', 'course', 'weekly', 'monthly', 'yearly'].includes(entry.type)) {
      return false;
    }
    
    // Path safety - no absolute paths, no parent traversal, no external URLs
    if (isSuspiciousPath(entry.encryptedPath)) {
      return false;
    }
    
    // Validate attachment paths
    if (entry.attachments) {
      for (const att of entry.attachments) {
        if (isSuspiciousPath(att.encryptedPath)) {
          return false;
        }
      }
    }
  }
  
  return true;
}

/**
 * Check for path traversal and external URLs
 */
function isSuspiciousPath(path: string): boolean {
  // Reject absolute paths
  if (path.startsWith('/') || path.startsWith('\\')) return true;
  
  // Reject parent directory traversal
  if (path.includes('..')) return true;
  
  // Reject external URLs
  if (path.includes('://') || path.includes('\\\\')) return true;
  
  // Reject special characters that might be dangerous
  if (/[<>:"|?*\0]/.test(path)) return true;
  
  return false;
}
