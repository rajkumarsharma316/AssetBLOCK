import { Keypair } from '@stellar/stellar-sdk';
import stellarHDWallet from 'stellar-hd-wallet';

/**
 * Generate a new random Stellar keypair and standard 24-word mnemonic phrase.
 */
export function generateKeypair() {
  const mnemonic = stellarHDWallet.generateMnemonic();
  const wallet = stellarHDWallet.fromMnemonic(mnemonic);
  const publicKey = wallet.getPublicKey(0);
  const secretKey = wallet.getSecret(0);

  return {
    publicKey,
    secretKey,
    mnemonic,
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
