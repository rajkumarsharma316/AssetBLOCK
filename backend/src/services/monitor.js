import { v4 as uuidv4 } from 'uuid';
import { findAll, run, insert } from '../db/database.js';
import { evaluateCondition, evaluateConditionGroup } from './conditions.js';
import { releaseEscrow } from './escrow.js';
import { createNotification } from './notifications.js';
import logger from '../utils/logger.js';
import config from '../config.js';

let monitorInterval = null;

/**
 * Start the background condition monitor.
 * Polls active contracts and evaluates their conditions every N ms.
 */
export function startMonitor() {
  if (monitorInterval) {
    logger.warn('Monitor already running');
    return;
  }

  const intervalMs = config.monitor.intervalMs;
  logger.info(`Starting condition monitor (interval: ${intervalMs}ms)`);

  monitorInterval = setInterval(async () => {
    try {
      await checkAllContracts();
    } catch (err) {
      logger.error('Monitor cycle error', { error: err.message });
    }
  }, intervalMs);

  // Run immediately on start too
  checkAllContracts().catch(err => {
    logger.error('Initial monitor check error', { error: err.message });
  });
}

/**
 * Stop the background monitor.
 */
export function stopMonitor() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    logger.info('Condition monitor stopped');
  }
}

/**
 * Check all active/funded contracts and evaluate their conditions.
 */
async function checkAllContracts() {
  // Get contracts that are funded — use supabase 'in' filter
  const { supabase } = await import('../db/database.js');
  const { data: activeContracts, error } = await supabase
    .from('contracts')
    .select('*')
    .in('status', ['funded', 'active']);

  if (error) {
    logger.error('Failed to fetch active contracts', { error: error.message });
    return;
  }

  if (!activeContracts || activeContracts.length === 0) return;

  logger.debug(`Checking ${activeContracts.length} active contracts`);

  for (const contract of activeContracts) {
    try {
      await checkContract(contract);
    } catch (err) {
      logger.error('Error checking contract', {
        contractId: contract.id,
        error: err.message,
      });
    }
  }
}

/**
 * Check a single contract's conditions and trigger release if all met.
 */
async function checkContract(contract) {
  const conditions = await findAll('conditions', { contract_id: contract.id });

  if (conditions.length === 0) {
    // No conditions — auto-release if funded
    if (contract.status === 'funded') {
      logger.info('No conditions on contract, auto-releasing', { contractId: contract.id });
      await triggerRelease(contract);
    }
    return;
  }

  // Evaluate individual conditions and update their status
  let anyUpdated = false;
  for (const condition of conditions) {
    if (condition.is_met) continue; // Already met

    const isMet = evaluateCondition(condition);
    if (isMet) {
      await run('conditions',
        { is_met: true, met_at: new Date().toISOString() },
        { id: condition.id }
      );
      condition.is_met = true;
      anyUpdated = true;

      logger.info('Condition met', {
        contractId: contract.id,
        conditionId: condition.id,
        type: condition.type,
      });

      await createNotification(
        contract.creator_public_key,
        contract.id,
        `Condition "${condition.type}" has been met for contract "${contract.title}"`
      );
    }
  }

  // Check if ALL conditions as a group are satisfied
  const allMet = evaluateConditionGroup(conditions);

  if (allMet) {
    // Mark contract as active if it was just funded
    if (contract.status === 'funded') {
      await run('contracts',
        { status: 'active', updated_at: new Date().toISOString() },
        { id: contract.id }
      );
    }
    await triggerRelease(contract);
  } else if (anyUpdated) {
    // At least mark it active
    if (contract.status === 'funded') {
      await run('contracts',
        { status: 'active', updated_at: new Date().toISOString() },
        { id: contract.id }
      );
    }
  }
}

/**
 * Trigger the release of escrowed funds.
 */
async function triggerRelease(contract) {
  try {
    logger.info('Triggering escrow release', { contractId: contract.id });
    const result = await releaseEscrow(contract.id);

    await createNotification(
      contract.creator_public_key,
      contract.id,
      `Payment released for contract "${contract.title}"! TX: ${result.hash}`
    );

    await createNotification(
      contract.destination,
      contract.id,
      `You received a payment from contract "${contract.title}"! TX: ${result.hash}`
    );

    logger.info('Escrow release successful', { contractId: contract.id, hash: result.hash });
  } catch (err) {
    logger.error('Escrow release failed', {
      contractId: contract.id,
      error: err.message,
    });

    // Mark as failed to avoid infinite retry loops on unrecoverable errors
    if (err.message.includes('op_bad_auth') || err.message.includes('op_underfunded') || err.message.includes('tx_bad_secret')) {
      await run('contracts',
        { status: 'failed', updated_at: new Date().toISOString() },
        { id: contract.id }
      );
      logger.info('Marked contract as failed due to unrecoverable error', { contractId: contract.id });
    }
  }
}

export default { startMonitor, stopMonitor };
