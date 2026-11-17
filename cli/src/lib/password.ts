/**
 * Password input utilities
 * SECURITY: Password only via environment variable or stdin, NEVER argv
 */

/**
 * Read password securely from stdin or environment
 * NEVER accepts password from command-line arguments
 */
export async function readPassword(useStdin: boolean): Promise<string> {
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
  
  // NEVER log or output the password
  return password;
}
