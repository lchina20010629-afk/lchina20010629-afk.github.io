import { describe, it, expect } from 'vitest';
import {
  encrypt,
  decrypt,
  decryptToString,
  createPasswordVerifier,
  verifyPassword,
  evaluatePasswordStrength,
  generateRandomBytes,
  DEFAULT_CRYPTO_CONFIG,
} from './crypto';
import type { EncryptedEnvelope } from '../types/crypto';

describe('Crypto Module', () => {
  const testPassword = 'TestPassword123!@#';

  describe('generateRandomBytes', () => {
    it('should generate random bytes of specified length', () => {
      const bytes = generateRandomBytes(32);
      expect(bytes.byteLength).toBe(32);
    });

    it('should generate different random values each time', () => {
      const bytes1 = new Uint8Array(generateRandomBytes(32));
      const bytes2 = new Uint8Array(generateRandomBytes(32));
      expect(bytes1).not.toEqual(bytes2);
    });
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt simple ASCII text', async () => {
      const plaintext = 'Hello, World!';
      const encrypted = await encrypt(plaintext, testPassword);
      
      // Verify envelope structure
      expect(encrypted.version).toBe('v1');
      expect(encrypted.algorithm).toBe('AES-256-GCM');
      expect(encrypted.kdf).toBe('PBKDF2-SHA256');
      expect(encrypted.iterations).toBe(DEFAULT_CRYPTO_CONFIG.iterations);
      expect(encrypted.salt).toMatch(/^[0-9a-f]{64}$/); // 32 bytes hex
      expect(encrypted.iv).toMatch(/^[0-9a-f]{24}$/); // 12 bytes hex
      expect(encrypted.ciphertext).toMatch(/^[0-9a-f]+$/);
      expect(encrypted.authTag).toMatch(/^[0-9a-f]{32}$/); // 16 bytes hex

      const decrypted = await decryptToString(encrypted, testPassword);
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt Unicode text (Chinese)', async () => {
      const plaintext = '今天是美好的一天！🌟 学习了英语和泰语。';
      const encrypted = await encrypt(plaintext, testPassword);
      const decrypted = await decryptToString(encrypted, testPassword);
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt long text', async () => {
      const plaintext = '这是一段很长的文本。'.repeat(1000);
      const encrypted = await encrypt(plaintext, testPassword);
      const decrypted = await decryptToString(encrypted, testPassword);
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt binary data', async () => {
      // Simulate image data
      const binaryData = new Uint8Array(1024);
      for (let i = 0; i < binaryData.length; i++) {
        binaryData[i] = i % 256;
      }

      const encrypted = await encrypt(binaryData.buffer, testPassword);
      const decrypted = await decrypt(encrypted, testPassword);
      
      const decryptedArray = new Uint8Array(decrypted);
      expect(decryptedArray).toEqual(binaryData);
    });

    it('should fail with wrong password', async () => {
      const plaintext = 'Secret message';
      const encrypted = await encrypt(plaintext, testPassword);
      
      await expect(
        decryptToString(encrypted, 'WrongPassword')
      ).rejects.toThrow('解密失败：密码错误或数据已损坏');
    });

    it('should fail with tampered ciphertext', async () => {
      const plaintext = 'Secret message';
      const encrypted = await encrypt(plaintext, testPassword);
      
      // Tamper with ciphertext by flipping first byte
      const firstByte = encrypted.ciphertext.substring(0, 2);
      const flipped = ((parseInt(firstByte, 16) ^ 0xFF) & 0xFF).toString(16).padStart(2, '0');
      const tampered: EncryptedEnvelope = {
        ...encrypted,
        ciphertext: flipped + encrypted.ciphertext.substring(2),
      };
      
      await expect(
        decryptToString(tampered, testPassword)
      ).rejects.toThrow('解密失败：密码错误或数据已损坏');
    });

    it('should fail with tampered authTag', async () => {
      const plaintext = 'Secret message';
      const encrypted = await encrypt(plaintext, testPassword);
      
      // Tamper with authTag
      const tampered: EncryptedEnvelope = {
        ...encrypted,
        authTag: encrypted.authTag.replace(/0/g, '1'),
      };
      
      await expect(
        decryptToString(tampered, testPassword)
      ).rejects.toThrow('解密失败：密码错误或数据已损坏');
    });

    it('should produce different ciphertext for same plaintext (different IV)', async () => {
      const plaintext = 'Same message';
      const encrypted1 = await encrypt(plaintext, testPassword);
      const encrypted2 = await encrypt(plaintext, testPassword);
      
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
      
      // Both should decrypt correctly
      const decrypted1 = await decryptToString(encrypted1, testPassword);
      const decrypted2 = await decryptToString(encrypted2, testPassword);
      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
    });

    it('should handle empty string', async () => {
      const plaintext = '';
      const encrypted = await encrypt(plaintext, testPassword);
      const decrypted = await decryptToString(encrypted, testPassword);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters and emojis', async () => {
      const plaintext = '特殊字符：!@#$%^&*()_+-=[]{}|;:",.<>?/~ 表情：😀😁😂🤣😃😄😅😆';
      const encrypted = await encrypt(plaintext, testPassword);
      const decrypted = await decryptToString(encrypted, testPassword);
      expect(decrypted).toBe(plaintext);
    });

    it('should use custom iterations', async () => {
      const plaintext = 'Test with custom config';
      const customConfig = {
        iterations: 100000,
        saltLength: 32,
        ivLength: 12,
      };
      
      const encrypted = await encrypt(plaintext, testPassword, customConfig);
      expect(encrypted.iterations).toBe(100000);
      
      const decrypted = await decryptToString(encrypted, testPassword);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('Password Verifier', () => {
    it('should create and verify correct password', async () => {
      const verifier = await createPasswordVerifier(testPassword);
      
      expect(verifier.salt).toMatch(/^[0-9a-f]{64}$/);
      expect(verifier.iterations).toBe(DEFAULT_CRYPTO_CONFIG.iterations);
      expect(verifier.verifierCiphertext).toBeTruthy();
      
      const isValid = await verifyPassword(testPassword, verifier);
      expect(isValid).toBe(true);
    });

    it('should reject wrong password', async () => {
      const verifier = await createPasswordVerifier(testPassword);
      const isValid = await verifyPassword('WrongPassword', verifier);
      expect(isValid).toBe(false);
    });

    it('should reject slightly different password', async () => {
      const verifier = await createPasswordVerifier(testPassword);
      const isValid = await verifyPassword(testPassword + ' ', verifier);
      expect(isValid).toBe(false);
    });

    it('should work with Unicode passwords', async () => {
      const unicodePassword = '我的密码123🔒';
      const verifier = await createPasswordVerifier(unicodePassword);
      
      const isValid = await verifyPassword(unicodePassword, verifier);
      expect(isValid).toBe(true);
      
      const isInvalid = await verifyPassword('我的密码123', verifier);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Password Strength Evaluation', () => {
    it('should rate strong password highly', () => {
      const result = evaluatePasswordStrength('MyStr0ng!P@ssw0rd#2024');
      expect(result.score).toBeGreaterThanOrEqual(3);
      expect(result.feedback.length).toBeLessThanOrEqual(1);
    });

    it('should rate weak password poorly', () => {
      const result = evaluatePasswordStrength('123456');
      expect(result.score).toBeLessThan(2);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should detect short password', () => {
      const result = evaluatePasswordStrength('Short1!');
      expect(result.feedback.some(f => f.includes('长度'))).toBe(true);
    });

    it('should detect missing character types', () => {
      const result = evaluatePasswordStrength('onlylowercase');
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should detect common patterns', () => {
      const result = evaluatePasswordStrength('password123');
      expect(result.feedback.some(f => f.includes('常见模式'))).toBe(true);
    });

    it('should rate mixed character password well', () => {
      const result = evaluatePasswordStrength('Abc123!@#XyzMno');
      expect(result.score).toBeGreaterThanOrEqual(2);
    });

    it('should handle empty password', () => {
      const result = evaluatePasswordStrength('');
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.feedback.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long passwords', async () => {
      const longPassword = 'A'.repeat(1000) + '1!';
      const plaintext = 'Test message';
      const encrypted = await encrypt(plaintext, longPassword);
      const decrypted = await decryptToString(encrypted, longPassword);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle passwords with null bytes', async () => {
      const passwordWithNull = 'pass\x00word';
      const plaintext = 'Test message';
      const encrypted = await encrypt(plaintext, passwordWithNull);
      const decrypted = await decryptToString(encrypted, passwordWithNull);
      expect(decrypted).toBe(plaintext);
    });

    it('should reject invalid envelope version', async () => {
      const plaintext = 'Test';
      const encrypted = await encrypt(plaintext, testPassword);
      const invalidEnvelope: EncryptedEnvelope = {
        ...encrypted,
        version: 'v2' as any,
      };
      
      await expect(
        decryptToString(invalidEnvelope, testPassword)
      ).rejects.toThrow('Unsupported envelope version');
    });

    it('should handle large binary data (simulated image)', async () => {
      // Simulate a 256KB image (crypto.getRandomValues has 65KB limit per call)
      const largeData = new Uint8Array(256 * 1024);
      // Fill in chunks due to crypto.getRandomValues 65KB limit
      const chunkSize = 65536;
      for (let i = 0; i < largeData.length; i += chunkSize) {
        const chunk = largeData.subarray(i, Math.min(i + chunkSize, largeData.length));
        crypto.getRandomValues(chunk);
      }
      
      const encrypted = await encrypt(largeData.buffer, testPassword);
      const decrypted = await decrypt(encrypted, testPassword);
      
      const decryptedArray = new Uint8Array(decrypted);
      expect(decryptedArray.length).toBe(largeData.length);
      expect(decryptedArray).toEqual(largeData);
    }, 10000); // 10 second timeout for large data
  });
});
