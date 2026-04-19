import {
  Horizon,
  Asset,
  TransactionBuilder,
  Operation,
  Keypair,
  Networks,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import config from '../config.js';
import logger from '../utils/logger.js';

const server = new Horizon.Server(config.horizon.url);

/**
 * Find available paths for a strict-receive path payment.
 */
export async function findPaths(sourcePublicKey, destAssetCode, destAssetIssuer, destAmount) {
  try {
    const destAsset = destAssetCode === 'XLM'
      ? Asset.native()
      : new Asset(destAssetCode, destAssetIssuer);

    const paths = await server
      .strictReceivePaths(
        sourcePublicKey,
        destAsset,
        destAmount
      )
      .call();

    return paths.records.map(p => ({
      sourceAssetCode: p.source_asset_type === 'native' ? 'XLM' : p.source_asset_code,
      sourceAssetIssuer: p.source_asset_issuer,
      sourceAmount: p.source_amount,
      destAmount: p.destination_amount,
      path: p.path,
    }));
  } catch (err) {
    logger.error('Path finding failed', { error: err.message });
    return [];
  }
}

/**
 * Build a path payment strict receive transaction.
 * Returns the XDR for client-side signing.
 */
export async function buildPathPaymentTx(
  sourcePublicKey,
  destination,
  sendAssetCode,
  sendAssetIssuer,
  destAssetCode,
  destAssetIssuer,
  destAmount,
  maxSend,
  pathAssets = []
) {
  const sendAsset = sendAssetCode === 'XLM'
    ? Asset.native()
    : new Asset(sendAssetCode, sendAssetIssuer);

  const destAsset = destAssetCode === 'XLM'
    ? Asset.native()
    : new Asset(destAssetCode, destAssetIssuer);

  const account = await server.loadAccount(sourcePublicKey);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.pathPaymentStrictReceive({
        sendAsset,
        sendMax: maxSend,
        destination,
        destAsset,
        destAmount,
        path: pathAssets.map(p =>
          p.asset_type === 'native' ? Asset.native() : new Asset(p.asset_code, p.asset_issuer)
        ),
      })
    )
    .setTimeout(300)
    .build();

  return tx.toXDR('base64');
}

export default { findPaths, buildPathPaymentTx };
