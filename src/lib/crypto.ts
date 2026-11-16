/**
 * 加密模块 - 使用 Web Crypto API
 * 
 * 算法: AES-256-GCM
 * 密钥派生: PBKDF2-SHA256 with 600,000+ iterations
 * 
 * 安全注意事项:
 * 1. 公开的密文可被复制，弱密码可能被离线暴力破解
 * 2. 请使用强密码（建议 ≥ 16 字符，包含大小写字母、数字、特殊字符）
 * 3. 定期导出加密备份到安全位置
 * 4. 密码一旦忘记无法恢复
 */

import type { EncryptedEnvelope, PasswordVerifier, CryptoConfig } from '../types/crypto';

/**
 * 默认加密配置
 */
export const DEFAULT_CRYPTO_CONFIG: CryptoConfig = {
  iterations: 600000, // OWASP 2023 推荐的 PBKDF2-SHA256 最小迭代次数
  saltLength: 32, // 256 bits
  ivLength: 12, // 96 bits (GCM 推荐)
};

/**
 * 固定的验证器字符串（用于生成密码验证器）
 */
const VERIFIER_PLAINTEXT = '__password_verifier_v1__';

/**
 * 将 ArrayBuffer 转换为 hex 字符串
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 将 hex 字符串转换为 ArrayBuffer
 */
function hexToBuffer(hex: string): ArrayBuffer {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

/**
 * 生成随机字节
 */
export function generateRandomBytes(length: number): ArrayBuffer {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes.buffer;
}

/**
 * 从密码派生加密密钥
 */
export async function deriveKey(
  password: string,
  salt: ArrayBuffer,
  iterations: number = DEFAULT_CRYPTO_CONFIG.iterations
): Promise<CryptoKey> {
  // 将密码转换为 key material
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // 派生 AES-GCM 密钥
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );

  return key;
}

/**
 * 加密数据
 */
export async function encrypt(
  plaintext: string | ArrayBuffer,
  password: string,
  config: CryptoConfig = DEFAULT_CRYPTO_CONFIG
): Promise<EncryptedEnvelope> {
  // 生成 salt 和 IV
  const salt = generateRandomBytes(config.saltLength);
  const iv = generateRandomBytes(config.ivLength);

  // 派生密钥
  const key = await deriveKey(password, salt, config.iterations);

  // 转换明文
  let plaintextBuffer: ArrayBuffer;
  if (typeof plaintext === 'string') {
    const encoder = new TextEncoder();
    plaintextBuffer = encoder.encode(plaintext);
  } else {
    plaintextBuffer = plaintext;
  }

  // 加密
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128, // 16 bytes auth tag
    },
    key,
    plaintextBuffer
  );

  // AES-GCM 的输出包含 ciphertext + authTag
  // 最后 16 字节是 authTag
  const ciphertextBytes = new Uint8Array(ciphertext);
  const actualCiphertext = ciphertextBytes.slice(0, -16);
  const authTag = ciphertextBytes.slice(-16);

  return {
    version: 'v1',
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    salt: bufferToHex(salt),
    iv: bufferToHex(iv),
    iterations: config.iterations,
    ciphertext: bufferToHex(actualCiphertext),
    authTag: bufferToHex(authTag),
  };
}

/**
 * 解密数据
 */
export async function decrypt(
  envelope: EncryptedEnvelope,
  password: string
): Promise<ArrayBuffer> {
  // 验证版本
  if (envelope.version !== 'v1') {
    throw new Error(`Unsupported envelope version: ${envelope.version}`);
  }

  // 解析 hex 数据
  const salt = hexToBuffer(envelope.salt);
  const iv = hexToBuffer(envelope.iv);
  const ciphertext = hexToBuffer(envelope.ciphertext);
  const authTag = hexToBuffer(envelope.authTag);

  // 派生密钥
  const key = await deriveKey(password, salt, envelope.iterations);

  // 合并 ciphertext 和 authTag
  const combined = new Uint8Array(ciphertext.byteLength + authTag.byteLength);
  combined.set(new Uint8Array(ciphertext), 0);
  combined.set(new Uint8Array(authTag), ciphertext.byteLength);

  // 解密
  try {
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128,
      },
      key,
      combined
    );
    return plaintext;
  } catch (error) {
    // 密码错误或数据被篡改
    throw new Error('解密失败：密码错误或数据已损坏');
  }
}

/**
 * 解密为字符串
 */
export async function decryptToString(
  envelope: EncryptedEnvelope,
  password: string
): Promise<string> {
  const buffer = await decrypt(envelope, password);
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}

/**
 * 创建密码验证器
 * 
 * 用于快速验证密码是否正确，无需解密实际数据
 */
export async function createPasswordVerifier(
  password: string,
  config: CryptoConfig = DEFAULT_CRYPTO_CONFIG
): Promise<PasswordVerifier> {
  const envelope = await encrypt(VERIFIER_PLAINTEXT, password, config);
  
  return {
    salt: envelope.salt,
    iterations: envelope.iterations,
    verifierCiphertext: JSON.stringify({
      iv: envelope.iv,
      ciphertext: envelope.ciphertext,
      authTag: envelope.authTag,
    }),
  };
}

/**
 * 验证密码
 */
export async function verifyPassword(
  password: string,
  verifier: PasswordVerifier
): Promise<boolean> {
  try {
    const verifierData = JSON.parse(verifier.verifierCiphertext);
    const envelope: EncryptedEnvelope = {
      version: 'v1',
      algorithm: 'AES-256-GCM',
      kdf: 'PBKDF2-SHA256',
      salt: verifier.salt,
      iterations: verifier.iterations,
      iv: verifierData.iv,
      ciphertext: verifierData.ciphertext,
      authTag: verifierData.authTag,
    };

    const plaintext = await decryptToString(envelope, password);
    return plaintext === VERIFIER_PLAINTEXT;
  } catch {
    return false;
  }
}

/**
 * 评估密码强度
 * 
 * @returns 0-4 的分数，4 为最强
 */
export function evaluatePasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // 长度
  if (password.length >= 16) {
    score += 1;
  } else if (password.length >= 12) {
    score += 0.5;
  } else {
    feedback.push('密码长度建议至少 16 个字符');
  }

  // 包含小写字母
  if (/[a-z]/.test(password)) {
    score += 0.5;
  } else {
    feedback.push('建议包含小写字母');
  }

  // 包含大写字母
  if (/[A-Z]/.test(password)) {
    score += 0.5;
  } else {
    feedback.push('建议包含大写字母');
  }

  // 包含数字
  if (/[0-9]/.test(password)) {
    score += 0.5;
  } else {
    feedback.push('建议包含数字');
  }

  // 包含特殊字符
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 0.5;
  } else {
    feedback.push('建议包含特殊字符');
  }

  // 复杂度额外分
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= password.length * 0.7) {
    score += 1;
  }

  // 常见模式检测
  const commonPatterns = ['123', 'abc', 'password', 'qwerty', '111'];
  const lowerPassword = password.toLowerCase();
  for (const pattern of commonPatterns) {
    if (lowerPassword.includes(pattern)) {
      score -= 1;
      feedback.push(`避免使用常见模式: ${pattern}`);
      break;
    }
  }

  // 归一化到 0-4
  score = Math.max(0, Math.min(4, score));

  return { score, feedback };
}
