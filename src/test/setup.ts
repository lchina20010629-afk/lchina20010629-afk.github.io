import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Setup Web Crypto API for tests
if (typeof global.crypto === 'undefined') {
  const { webcrypto } = await import('node:crypto');
  global.crypto = webcrypto as Crypto;
}
