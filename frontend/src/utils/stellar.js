import { Keypair } from '@stellar/stellar-sdk';

/**
 * Generate a new random Stellar keypair.
 */
export function generateKeypair() {
  const pair = Keypair.random();
  return {
    publicKey: pair.publicKey(),
    secretKey: pair.secret(),
  };
}

/**
 * Validate a Stellar public key.
 */
export function isValidPublicKey(key) {
  if (!key || key.length !== 56 || !key.startsWith('G')) return false;
  try {
    Keypair.fromPublicKey(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a Stellar secret key.
 */
export function isValidSecretKey(key) {
  if (!key || key.length !== 56 || !key.startsWith('S')) return false;
  try {
    Keypair.fromSecret(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get public key from a secret key.
 */
export function publicKeyFromSecret(secret) {
  try {
    return Keypair.fromSecret(secret).publicKey();
  } catch {
    return null;
  }
}
