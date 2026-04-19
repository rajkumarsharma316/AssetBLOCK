import {
  Keypair,
  TransactionBuilder,
  Operation,
  Networks,
  Asset,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import { v4 as uuidv4 } from 'uuid';
import stellarService from './stellar.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { findOne, findAll, run, insert } from '../db/database.js';
import logger from '../utils/logger.js';

/**
 * Create a new escrow account for a contract.
 * 1. Generate keypair
 * 2. Fund via friendbot
 * 3. Configure multi-sig with provided signers
 * 4. Store encrypted secret
 */
export async function createEscrow(contractId, signerPublicKeys, creatorPublicKey, threshold = 2) {
  const { publicKey, secretKey } = stellarService.generateKeypair();

  // Fund escrow account on testnet
  await stellarService.fundWithFriendbot(publicKey);

  // All signers include the creator
  const allSigners = [...new Set([creatorPublicKey, ...signerPublicKeys])];

  // Configure multi-sig
  await stellarService.configureMultiSig(secretKey, allSigners, threshold);

  // Encrypt and store the secret
  const encryptedSecret = encrypt(secretKey);

  // Update contract with escrow info
  run(
    'UPDATE contracts SET escrow_public_key = ?, escrow_secret_encrypted = ?, updated_at = datetime(\'now\') WHERE id = ?',
    [publicKey, encryptedSecret, contractId]
  );

  // Log the escrow creation transaction
  insert('transactions', {
    id: uuidv4(),
    contract_id: contractId,
    tx_hash: null,
    type: 'escrow_create',
    status: 'confirmed',
    amount: '0',
    details: JSON.stringify({ escrow: publicKey, signers: allSigners }),
  });

  logger.info('Escrow created', { contractId, escrow: publicKey });
  return { publicKey, signers: allSigners };
}

/**
 * Fund an escrow account by sending XLM from the creator.
 * The creator signs this transaction client-side via Freighter.
 * Backend builds the XDR for the client to sign.
 */
export async function buildFundTransaction(contractId, senderPublicKey) {
  const contract = findOne('SELECT * FROM contracts WHERE id = ?', [contractId]);
  if (!contract) throw new Error('Contract not found');
  if (!contract.escrow_public_key) throw new Error('Escrow not yet created');

  const account = await stellarService.loadAccount(senderPublicKey);
  const asset = contract.asset_code === 'XLM'
    ? Asset.native()
    : new Asset(contract.asset_code, contract.asset_issuer);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: contract.escrow_public_key,
        asset,
        amount: contract.amount,
      })
    )
    .setTimeout(300)
    .build();

  return tx.toXDR('base64');
}

/**
 * Mark a contract as funded after the client submits the fund transaction.
 */
export function markFunded(contractId, txHash) {
  run(
    'UPDATE contracts SET status = \'funded\', updated_at = datetime(\'now\') WHERE id = ?',
    [contractId]
  );

  insert('transactions', {
    id: uuidv4(),
    contract_id: contractId,
    tx_hash: txHash,
    type: 'fund',
    status: 'confirmed',
    amount: findOne('SELECT amount FROM contracts WHERE id = ?', [contractId])?.amount,
    details: null,
  });

  logger.info('Contract funded', { contractId, txHash });
}

/**
 * Release funds from escrow to the destination.
 * Uses the encrypted escrow secret to sign.
 */
export async function releaseEscrow(contractId) {
  const contract = findOne('SELECT * FROM contracts WHERE id = ?', [contractId]);
  if (!contract) throw new Error('Contract not found');
  if (!contract.escrow_secret_encrypted) throw new Error('No escrow secret');

  const escrowSecret = decrypt(contract.escrow_secret_encrypted);
  const escrowKeypair = Keypair.fromSecret(escrowSecret);
  const account = await stellarService.loadAccount(contract.escrow_public_key);

  // Determine the payment asset
  const paymentAsset = contract.asset_code === 'XLM'
    ? Asset.native()
    : new Asset(contract.asset_code, contract.asset_issuer);

  // Build payment from escrow to destination
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: contract.destination,
        asset: paymentAsset,
        amount: contract.amount,
      })
    )
    .setTimeout(300)
    .build();

  // Sign with escrow key
  tx.sign(escrowKeypair);

  const result = await stellarService.submitTransaction(tx);

  // Update contract status
  run(
    'UPDATE contracts SET status = \'completed\', updated_at = datetime(\'now\') WHERE id = ?',
    [contractId]
  );

  insert('transactions', {
    id: uuidv4(),
    contract_id: contractId,
    tx_hash: result.hash,
    type: 'release',
    status: 'confirmed',
    amount: contract.amount,
    details: JSON.stringify({ destination: contract.destination }),
  });

  logger.info('Escrow released', { contractId, hash: result.hash });
  return result;
}

/**
 * Refund escrow back to the creator.
 */
export async function refundEscrow(contractId) {
  const contract = findOne('SELECT * FROM contracts WHERE id = ?', [contractId]);
  if (!contract) throw new Error('Contract not found');
  if (!contract.escrow_secret_encrypted) throw new Error('No escrow secret');

  const escrowSecret = decrypt(contract.escrow_secret_encrypted);
  const escrowKeypair = Keypair.fromSecret(escrowSecret);
  const account = await stellarService.loadAccount(contract.escrow_public_key);

  const paymentAsset = contract.asset_code === 'XLM'
    ? Asset.native()
    : new Asset(contract.asset_code, contract.asset_issuer);

  // Get current balance to refund
  const balances = account.balances;
  const nativeBalance = balances.find(b => b.asset_type === 'native');
  // Keep minimum for fees
  const refundAmount = contract.asset_code === 'XLM'
    ? (parseFloat(nativeBalance.balance) - 2).toFixed(7)
    : contract.amount;

  if (parseFloat(refundAmount) <= 0) {
    throw new Error('Insufficient balance for refund');
  }

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: contract.creator_public_key,
        asset: paymentAsset,
        amount: refundAmount,
      })
    )
    .setTimeout(300)
    .build();

  tx.sign(escrowKeypair);
  const result = await stellarService.submitTransaction(tx);

  run(
    'UPDATE contracts SET status = \'cancelled\', updated_at = datetime(\'now\') WHERE id = ?',
    [contractId]
  );

  insert('transactions', {
    id: uuidv4(),
    contract_id: contractId,
    tx_hash: result.hash,
    type: 'refund',
    status: 'confirmed',
    amount: refundAmount,
    details: JSON.stringify({ refundTo: contract.creator_public_key }),
  });

  logger.info('Escrow refunded', { contractId, hash: result.hash });
  return result;
}

export default {
  createEscrow,
  buildFundTransaction,
  markFunded,
  releaseEscrow,
  refundEscrow,
};
