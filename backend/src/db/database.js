import { createClient } from '@supabase/supabase-js';
import config from '../config.js';
import logger from '../utils/logger.js';

// Initialize Supabase client
const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

logger.info('Supabase client initialized', { url: config.supabase.url });

/**
 * Find a single row from a table matching the given filters.
 * @param {string} table - Table name
 * @param {object} filters - Key-value pairs to match (AND)
 * @returns {Promise<object|null>}
 */
export async function findOne(table, filters = {}) {
  let query = supabase.from(table).select('*');

  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    logger.error('findOne error', { table, filters, error: error.message });
    throw error;
  }

  return data;
}

/**
 * Find all rows from a table matching the given filters.
 * @param {string} table - Table name
 * @param {object} filters - Key-value pairs to match (AND)
 * @param {object} options - { orderBy, ascending, limit, offset, orFilters }
 * @returns {Promise<object[]>}
 */
export async function findAll(table, filters = {}, options = {}) {
  let query = supabase.from(table).select('*');

  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }

  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? false });
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('findAll error', { table, filters, error: error.message });
    throw error;
  }

  return data || [];
}

/**
 * Update rows in a table matching the given filters.
 * @param {string} table - Table name
 * @param {object} updates - Key-value pairs to update
 * @param {object} filters - Key-value pairs to match rows
 * @returns {Promise<object[]>}
 */
export async function run(table, updates, filters = {}) {
  let query = supabase.from(table).update(updates);

  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }

  const { data, error } = await query.select();

  if (error) {
    logger.error('run (update) error', { table, filters, error: error.message });
    throw error;
  }

  return data;
}

/**
 * Insert a row into a table.
 * @param {string} table - Table name
 * @param {object} data - Row data
 * @returns {Promise<object>}
 */
export async function insert(table, rowData) {
  const { data, error } = await supabase.from(table).insert(rowData).select().single();

  if (error) {
    logger.error('insert error', { table, error: error.message });
    throw error;
  }

  return data;
}

/**
 * Call a Supabase RPC function (for complex queries with JOINs).
 * @param {string} fnName - Function name
 * @param {object} params - Function parameters
 * @returns {Promise<object[]>}
 */
export async function rpc(fnName, params = {}) {
  const { data, error } = await supabase.rpc(fnName, params);

  if (error) {
    logger.error('rpc error', { fnName, params, error: error.message });
    throw error;
  }

  return data || [];
}

/**
 * Get the raw supabase client for advanced queries.
 */
export { supabase };

export default { supabase, findOne, findAll, run, insert, rpc };
