import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus2,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Zap,
  X,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/create', label: 'Create Contract', icon: FilePlus2 },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
];

export default function Sidebar({ collapsed, onToggle, className = '', isMobile = false }) {
  const location = useLocation();

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
      {/* Logo */}
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
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Zap size={22} color="white" />
          </div>
          {(!collapsed || isMobile) && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.2 }}>CPE</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>
                PAYMENT ENGINE
              </div>
            </div>
          )}
        </div>
        {/* Close button on mobile */}
        {isMobile && (
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

      {/* Collapse Toggle (desktop only) */}
      {!isMobile && (
        <button
          onClick={onToggle}
          style={{
            padding: '16px',
            borderTop: '1px solid var(--border-primary)',
            background: 'none',
            border: 'none',
            borderTop: '1px solid var(--border-primary)',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color var(--transition-fast)',
          }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      )}
    </aside>
  );
}
