import logger from '../utils/logger.js';

/**
 * Condition types supported by the engine.
 */
export const CONDITION_TYPES = {
  TIME: 'time',
  APPROVAL: 'approval',
  ORACLE: 'oracle',
};

/**
 * Evaluate a single condition.
 * Returns true if the condition is currently met.
 */
export function evaluateCondition(condition) {
  const params = typeof condition.params === 'string'
    ? JSON.parse(condition.params)
    : condition.params;

  switch (condition.type) {
    case CONDITION_TYPES.TIME:
      return evaluateTimeCondition(params);
    case CONDITION_TYPES.APPROVAL:
      return evaluateApprovalCondition(params);
    case CONDITION_TYPES.ORACLE:
      return evaluateOracleCondition(params);
    default:
      logger.warn('Unknown condition type', { type: condition.type });
      return false;
  }
}

/**
 * Time-based condition: met when current time >= releaseAfter timestamp.
 */
function evaluateTimeCondition(params) {
  const releaseTime = new Date(params.releaseAfter).getTime();
  const now = Date.now();
  return now >= releaseTime;
}

/**
 * Approval-based condition: met when approvals count >= required approvals.
 */
function evaluateApprovalCondition(params) {
  const current = parseInt(params.currentApprovals || 0, 10);
  const required = parseInt(params.requiredApprovals || 1, 10);
  return current >= required;
}

/**
 * Oracle condition: placeholder for external data integration.
 * In production, this would call an external API/oracle.
 */
function evaluateOracleCondition(params) {
  // For demo, check if a target value has been reached
  if (params.targetValue && params.currentValue) {
    return parseFloat(params.currentValue) >= parseFloat(params.targetValue);
  }
  return false;
}

/**
 * Evaluate a group of conditions with AND/OR logic.
 *
 * Conditions are organized into logic_groups.
 * Within each group, conditions are combined with the group's operator.
 * Groups themselves are combined with AND (all groups must pass).
 *
 * Example:
 *   Group 0 (AND): [time > X, approval >= 2] — both must be true
 *   Group 1 (OR):  [oracle check A, oracle check B] — at least one true
 *   Final: Group 0 AND Group 1
 */
export function evaluateConditionGroup(conditions) {
  if (!conditions || conditions.length === 0) return true;

  // Group conditions by logic_group
  const groups = {};
  for (const cond of conditions) {
    const groupId = cond.logic_group || 0;
    if (!groups[groupId]) {
      groups[groupId] = {
        operator: cond.logic_operator || 'AND',
        conditions: [],
      };
    }
    groups[groupId].conditions.push(cond);
  }

  // Evaluate each group, then AND them all together
  for (const [groupId, group] of Object.entries(groups)) {
    const results = group.conditions.map(c => {
      const met = c.is_met ? true : evaluateCondition(c);
      return met;
    });

    let groupResult;
    if (group.operator === 'OR') {
      groupResult = results.some(Boolean);
    } else {
      // Default AND
      groupResult = results.every(Boolean);
    }

    if (!groupResult) {
      logger.debug('Condition group not met', { groupId, operator: group.operator, results });
      return false;
    }
  }

  return true;
}

export default {
  CONDITION_TYPES,
  evaluateCondition,
  evaluateConditionGroup,
};
