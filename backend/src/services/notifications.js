import { v4 as uuidv4 } from 'uuid';
import { insert, findAll, run } from '../db/database.js';

/**
 * Create a new notification for a user.
 */
export async function createNotification(userPublicKey, contractId, message) {
  insert('notifications', {
    id: uuidv4(),
    user_public_key: userPublicKey,
    contract_id: contractId,
    message,
    read: 0,
  });
}

/**
 * Get unread notifications for a user.
 */
export function getNotifications(userPublicKey, includeRead = false) {
  const sql = includeRead
    ? 'SELECT * FROM notifications WHERE user_public_key = ? ORDER BY created_at DESC LIMIT 50'
    : 'SELECT * FROM notifications WHERE user_public_key = ? AND read = 0 ORDER BY created_at DESC LIMIT 50';
  return findAll(sql, [userPublicKey]);
}

/**
 * Mark a notification as read.
 */
export function markRead(notificationId) {
  run('UPDATE notifications SET read = 1 WHERE id = ?', [notificationId]);
}

/**
 * Mark all notifications as read for a user.
 */
export function markAllRead(userPublicKey) {
  run('UPDATE notifications SET read = 1 WHERE user_public_key = ?', [userPublicKey]);
}

export default { createNotification, getNotifications, markRead, markAllRead };
