import { useState, useEffect } from 'react';
import { Server, Database, Cpu, HardDrive } from 'lucide-react';
import client from '../api/client';

export default function Monitoring() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await client.get('/monitor/health');
        if (response.data.status === 'success') {
          setHealth(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load health status:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHealth();
    // Refresh every 10 seconds
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !health) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!health) {
    return <div className="card">Failed to load system health. Backend might be down.</div>;
  }

  // Format uptime
  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="page-container" style={{ padding: '24px' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">System Monitoring</h1>
          <p className="page-description">Live infrastructure health and performance.</p>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '8px 16px', 
          background: 'rgba(34, 197, 94, 0.1)', 
          borderRadius: '20px',
          color: 'var(--success)',
          fontWeight: 600,
          fontSize: '0.875rem'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
          System Operational
        </div>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* API Server */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '10px', color: 'var(--accent-cyan)' }}>
              <Server size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>API Server</h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Status</span>
            <span style={{ color: 'var(--success)', fontWeight: 500 }}>Online</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Uptime</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{formatUptime(health.uptime)}</span>
          </div>
        </div>

        {/* Database */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '10px', color: 'var(--accent-purple)' }}>
              <Database size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Database</h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Status</span>
            <span style={{ color: health.database.status === 'healthy' ? 'var(--success)' : 'var(--danger)', fontWeight: 500 }}>
              {health.database.status.toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Latency</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{health.database.latencyMs}ms</span>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '10px', color: 'var(--accent-pink)' }}>
              <Cpu size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Worker Status</h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Contract Monitor</span>
            <span style={{ color: 'var(--success)', fontWeight: 500 }}>{health.workers.contractMonitor}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Last Run</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              {new Date(health.workers.lastRun).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
      
      {/* Logs / Additional Info Panel */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HardDrive size={18} /> Server Metrics (Raw)
        </h3>
        <pre style={{ 
          background: 'var(--bg-tertiary)', 
          padding: '16px', 
          borderRadius: '8px',
          overflowX: 'auto',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)'
        }}>
          {JSON.stringify(health.system, null, 2)}
        </pre>
      </div>
    </div>
  );
}
