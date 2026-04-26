import { useState, useEffect } from 'react';
import { Users, Activity, FileText, ArrowUpRight } from 'lucide-react';
import client from '../api/client';

export default function Metrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await client.get('/metrics');
        if (response.data.status === 'success') {
          setMetrics(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!metrics) {
    return <div className="card">Failed to load metrics. Ensure backend is running.</div>;
  }

  return (
    <div className="page-container" style={{ padding: '24px' }}>
      <header className="page-header">
        <h1 className="page-title">Platform Metrics</h1>
        <p className="page-description">Real-time usage statistics and performance indicators.</p>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Metric Card 1 */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '12px', color: 'var(--accent-cyan)' }}>
              <Users size={24} />
            </div>
            <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: 600 }}>
              +12% <ArrowUpRight size={16} />
            </span>
          </div>
          <h3 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            {metrics.totalUsers}
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Verified Users</p>
        </div>

        {/* Metric Card 2 */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '12px', color: 'var(--accent-purple)' }}>
              <Activity size={24} />
            </div>
            <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: 600 }}>
              +5% <ArrowUpRight size={16} />
            </span>
          </div>
          <h3 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            {metrics.dailyActiveUsers}
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Daily Active Users</p>
        </div>

        {/* Metric Card 3 */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '12px', color: 'var(--accent-pink)' }}>
              <FileText size={24} />
            </div>
            <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: 600 }}>
              +24% <ArrowUpRight size={16} />
            </span>
          </div>
          <h3 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            {metrics.totalContracts}
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Smart Contracts</p>
        </div>
      </div>

      {/* Mock Chart Area */}
      <div className="card" style={{ padding: '24px', minHeight: '300px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '24px' }}>Transaction Volume (Last 30 Days)</h3>
        <div style={{ 
          height: '200px', 
          background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0) 100%)',
          borderBottom: '2px solid var(--accent-cyan)',
          position: 'relative',
          borderRadius: '8px'
        }}>
          {/* Simple visual representation for the dashboard */}
          <div style={{ position: 'absolute', bottom: '10px', left: '20px', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            Current Volume: ${metrics.volumeUsd.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
