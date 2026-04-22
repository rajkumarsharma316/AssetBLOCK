import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus2,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  MessageSquareHeart,
  Download,
  X,
} from 'lucide-react';
import { feedbackApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ABLogo from './ABLogo';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/create', label: 'Create Contract', icon: FilePlus2 },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
];

export default function Sidebar({ collapsed, onToggle, className = '', isMobile = false }) {
  const location = useLocation();
  const { user } = useAuth();
  const isFeedbackActive = location.pathname === '/feedback';
  
  // Check if current user is admin
  const isAdmin = user && user.publicKey === import.meta.env.VITE_ADMIN_WALLET;

  const handleExportFeedback = async () => {
    try {
      const response = await feedbackApi.exportCsv();
      
      // Create a blob from the response and trigger download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'assetblock_feedback.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export feedback:', err);
      alert('Failed to export feedback. Make sure you are an admin.');
    }
  };

  return (
    <aside
      className={`sidebar ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: collapsed && !isMobile ? 72 : 260,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-primary)',
        display: 'flex',
        flexDirection: 'column',
        transition: isMobile ? 'transform var(--transition-base)' : 'width var(--transition-base)',
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {/* Logo + Collapse Toggle */}
      <div
        style={{
          padding: collapsed && !isMobile ? '24px 16px' : '24px 20px',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          minHeight: 80,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ABLogo size={40} />
          {(!collapsed || isMobile) && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.2 }}>AssetBlock</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>
                SMART PAYMENTS
              </div>
            </div>
          )}
        </div>

        {/* Collapse toggle (desktop) / Close button (mobile) */}
        {isMobile ? (
          <button
            onClick={onToggle}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        ) : (
          <button
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm)',
              transition: 'all var(--transition-fast)',
              flexShrink: 0,
              width: 28,
              height: 28,
            }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '16px 8px' }}>
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: 4,
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                border: isActive ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.88rem',
                transition: 'all var(--transition-fast)',
                textDecoration: 'none',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                minHeight: 44,
              }}
              title={collapsed && !isMobile ? label : undefined}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              {(!collapsed || isMobile) && label}
            </Link>
          );
        })}
      </nav>

      {/* Feedback Link (bottom) */}
      <div
        style={{
          padding: '8px 8px 16px',
          borderTop: '1px solid var(--border-primary)',
        }}
      >
        <Link
          to="/feedback"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            color: isFeedbackActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            background: isFeedbackActive ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
            border: isFeedbackActive ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid transparent',
            fontWeight: isFeedbackActive ? 600 : 500,
            fontSize: '0.88rem',
            transition: 'all var(--transition-fast)',
            textDecoration: 'none',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
            minHeight: 44,
          }}
          title={collapsed && !isMobile ? 'Feedback' : undefined}
        >
          <MessageSquareHeart size={20} style={{ flexShrink: 0 }} />
          {(!collapsed || isMobile) && 'Feedback'}
        </Link>
        
        {/* Admin Section */}
        {isAdmin && (
          <div style={{ marginTop: 16 }}>
            {(!collapsed || isMobile) && (
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 16px', marginBottom: 8 }}>
                Admin Options
              </div>
            )}
            <button
              onClick={handleExportFeedback}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                background: 'transparent',
                border: '1px solid transparent',
                fontWeight: 500,
                fontSize: '0.88rem',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer',
                justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                minHeight: 44,
              }}
              title={collapsed && !isMobile ? 'Export Feedback CSV' : undefined}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Download size={20} style={{ flexShrink: 0 }} />
              {(!collapsed || isMobile) && 'Export Feedback'}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
