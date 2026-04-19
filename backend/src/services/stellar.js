import {
  Keypair,
  Horizon,
  TransactionBuilder,
  Operation,
  Networks,
  Asset,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import config from '../config.js';
import logger from '../utils/logger.js';

const server = new Horizon.Server(config.horizon.url);

/**
 * Get the Horizon server instance
 */
export function getServer() {
  return server;
}

/**
 * Generate a new random keypair
 */
export function generateKeypair() {
  const pair = Keypair.random();
  return {
    publicKey: pair.publicKey(),
    secretKey: pair.secret(),
  };
}

/**
 * Fund an account on testnet using Friendbot
 */
export async function fundWithFriendbot(publicKey) {
  try {
    const response = await fetch(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
    );
    if (!response.ok) {
      throw new Error(`Friendbot error: ${response.statusText}`);
    }
    const data = await response.json();
    logger.info('Account funded via Friendbot', { publicKey });
    return data;
  } catch (err) {
    logger.error('Friendbot funding failed', { publicKey, error: err.message });
    throw err;
  }
}

/**
 * Load a Stellar account
 */
export async function loadAccount(publicKey) {
  return server.loadAccount(publicKey);
}

/**
 * Configure multi-signature on an escrow account.
 * Adds signers and adjusts thresholds so that the combined weight of signers
 * is required to authorize payments.
 */
export async function configureMultiSig(escrowSecret, signerPublicKeys, mediumThreshold = 2) {
  const escrowKeypair = Keypair.fromSecret(escrowSecret);
  const account = await server.loadAccount(escrowKeypair.publicKey());

  const builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  });

  // Add each signer with weight 1
  for (const signerPubKey of signerPublicKeys) {
    builder.addOperation(
      Operation.setOptions({
        signer: {
          ed25519PublicKey: signerPubKey,
          weight: 1,
        },
      })
    );
  }

  // Set thresholds — medium threshold controls payments
  builder.addOperation(
    Operation.setOptions({
      lowThreshold: 1,
      medThreshold: mediumThreshold,
      highThreshold: mediumThreshold + 1,
      masterWeight: 1,
    })
  );

  const tx = builder.setTimeout(120).build();
  tx.sign(escrowKeypair);

  const result = await server.submitTransaction(tx);
  logger.info('Multi-sig configured on escrow', {
    escrow: escrowKeypair.publicKey(),
    signers: signerPublicKeys,
    threshold: mediumThreshold,
  });
  return result;
}

/**
 * Build a payment transaction (unsigned)
 */
export function buildPaymentTransaction(sourceAccount, destination, amount, asset = Asset.native()) {
  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset,
        amount: String(amount),
      })
    )
    .setTimeout(300)
    .build();

  return tx;
}

/**
 * Submit a signed transaction
 */
export async function submitTransaction(tx) {
  try {
    const result = await server.submitTransaction(tx);
    logger.info('Transaction submitted', { hash: result.hash });
    return { success: true, hash: result.hash, result };
  } catch (err) {
    const errorData = err.response?.data?.extras?.result_codes;
    logger.error('Transaction submission failed', { error: err.message, codes: errorData });
    throw new Error(`Transaction failed: ${JSON.stringify(errorData || err.message)}`);
  }
}

/**
 * Get the balance of an account
 */
export async function getBalance(publicKey) {
  try {
    const account = await server.loadAccount(publicKey);
    return account.balances;
  } catch (err) {
    logger.error('Failed to load balance', { publicKey, error: err.message });
    throw err;
  }
}

/**
 * Get transaction history for an account
 */
export async function getTransactionHistory(publicKey, limit = 20) {
  try {
    const txs = await server
      .transactions()
      .forAccount(publicKey)
      .order('desc')
      .limit(limit)
      .call();
    return txs.records;
  } catch (err) {
    logger.error('Failed to load tx history', { publicKey, error: err.message });
    return [];
  }
}

export default {
  getServer,
  generateKeypair,
  fundWithFriendbot,
  loadAccount,
  configureMultiSig,
  buildPaymentTransaction,
  submitTransaction,
  getBalance,
  getTransactionHistory,
};
