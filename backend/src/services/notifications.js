import { v4 as uuidv4 } from 'uuid';
import { insert, findAll, run } from '../db/database.js';

/**
 * Create a new notification for a user.
 */
export async function createNotification(userPublicKey, contractId, message) {
  await insert('notifications', {
    id: uuidv4(),
    user_public_key: userPublicKey,
    contract_id: contractId,
    message,
    read: false,
  });
}

/**
 * Get unread notifications for a user.
 */
export async function getNotifications(userPublicKey, includeRead = false) {
  if (includeRead) {
    return await findAll('notifications', { user_public_key: userPublicKey }, {
      orderBy: 'created_at',
      ascending: false,
      limit: 50,
    });
  }

  return await findAll('notifications', { user_public_key: userPublicKey, read: false }, {
    orderBy: 'created_at',
    ascending: false,
    limit: 50,
  });
}

/**
 * Mark a notification as read.
 */
export async function markRead(notificationId) {
  await run('notifications', { read: true }, { id: notificationId });
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllRead(userPublicKey) {
  await run('notifications', { read: true }, { user_public_key: userPublicKey });
}

export default { createNotification, getNotifications, markRead, markAllRead };
