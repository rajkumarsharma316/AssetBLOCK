import express from 'express';
import { supabase } from '../db/database.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Implementation of Data Indexing Requirement
router.get('/contracts', async (req, res) => {
  try {
    const { 
      status, 
      creator, 
      minAmount, 
      maxAmount, 
      search,
      page = 1, 
      limit = 10,
      sortBy = 'created_at',
      order = 'desc'
    } = req.query;

    let query = supabase.from('contracts').select('*', { count: 'exact' });

    // Apply filters
    if (status) query = query.eq('status', status);
    if (creator) query = query.eq('creator', creator);
    if (minAmount) query = query.gte('amount', minAmount);
    if (maxAmount) query = query.lte('amount', maxAmount);
    
    // Search indexing on title/description
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    // Sorting
    query = query.order(sortBy, { ascending: order === 'asc' });

    const { data, count, error } = await query;

    if (error) throw error;

    res.json({
      status: 'success',
      data,
      meta: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Data indexing error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch indexed data' });
  }
});

export default router;
