import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { truncateAddress, formatRelativeTime } from '../utils/formatters';
import { authApi } from '../api/client';
import { Bell, LogOut, Wallet, ExternalLink } from 'lucide-react';

export default function Navbar() {
  const { user, logout, notifications, fetchNotifications } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkAllRead = async () => {
    await authApi.markAllRead();
    fetchNotifications();
  };

  return (
    <header
      style={{
        height: 64,
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 16,
        borderBottom: '1px solid var(--border-primary)',
        background: 'rgba(10, 14, 26, 0.8)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Balance */}
      {user?.balance && (
        <div
          style={{
            padding: '6px 14px',
            background: 'var(--bg-glass)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-primary)',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Wallet size={14} />
          {parseFloat(user.balance).toFixed(2)} XLM
        </div>
      )}

      {/* Notifications */}
      <div ref={notifRef} style={{ position: 'relative' }}>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setShowNotif(!showNotif)}
          style={{ position: 'relative' }}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="notification-badge-count">{unreadCount}</span>
          )}
        </button>

        {showNotif && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              width: 360,
              maxHeight: 400,
              overflowY: 'auto',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 100,
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
              {unreadCount > 0 && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleMarkAllRead}
                  style={{ fontSize: '0.75rem' }}
                >
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '12px 18px',
                    borderBottom: '1px solid var(--border-primary)',
                    background: n.read ? 'transparent' : 'rgba(6, 182, 212, 0.04)',
                    fontSize: '0.84rem',
                    color: n.read ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                  }}
                >
                  <div>{n.message}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                    {formatRelativeTime(n.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* User address */}
      {user && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <a
            href={`https://stellar.expert/explorer/testnet/account/${user.publicKey}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '6px 14px',
              background: 'var(--bg-glass)',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-primary)',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: 'none',
            }}
          >
            {truncateAddress(user.publicKey, 6)}
            <ExternalLink size={12} />
          </a>

          <button className="btn btn-ghost btn-icon" onClick={logout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      )}
    </header>
  );
}
