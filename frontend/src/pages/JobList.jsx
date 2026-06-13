import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { truncateAddress, formatAmount, formatRelativeTime } from '../utils/formatters';
import {
  Search,
  Briefcase,
  Clock,
  Users,
  DollarSign,
  Filter,
  Plus,
  ChevronRight,
  Loader2,
} from 'lucide-react';

export default function JobList() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'my'

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      if (viewMode === 'my') params.my = 'true';
      const { data } = await jobsApi.list(params);
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, viewMode]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.25)' };
      case 'assigned': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.25)' };
      case 'completed': return { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.25)' };
      case 'cancelled': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.25)' };
      default: return { bg: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.25)' };
    }
  };

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Briefcase size={28} style={{ color: 'var(--accent-cyan)' }} />
            Job Marketplace
          </h1>
          <p>Find work or post jobs with blockchain-secured escrow payments</p>
        </div>
        <Link to="/jobs/post" className="btn btn-primary btn-lg" id="post-job-btn">
          <Plus size={18} />
          Post a Job
        </Link>
      </div>

      {/* Filters Bar */}
      <div
        className="glass-card no-hover"
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: '16px 20px',
          marginBottom: 24,
        }}
      >
        {/* Search */}
        <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 200, display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36, marginBottom: 0 }}
              id="job-search-input"
            />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ flexShrink: 0 }}>
            <Search size={16} />
          </button>
        </form>

        {/* View Toggle */}
        <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
          <button
            className={`btn btn-sm ${viewMode === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('all')}
            style={{ fontSize: '0.8rem' }}
          >
            All Jobs
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'my' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('my')}
            style={{ fontSize: '0.8rem' }}
          >
            My Posts
          </button>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={14} style={{ color: 'var(--text-tertiary)' }} />
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto', marginBottom: 0, minWidth: 120 }}
            id="job-status-filter"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Job Listings */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Loader2 size={32} className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div
          className="glass-card no-hover"
          style={{ textAlign: 'center', padding: '60px 20px' }}
        >
          <Briefcase size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>No jobs found</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', marginBottom: 24 }}>
            {viewMode === 'my'
              ? "You haven't posted any jobs yet."
              : 'No matching jobs. Try adjusting your filters.'}
          </p>
          <Link to="/jobs/post" className="btn btn-primary">
            <Plus size={16} />
            Post the First Job
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {jobs.map((job) => {
            const statusStyle = getStatusColor(job.status);
            const isOwner = job.client_public_key === user?.publicKey;
            return (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="glass-card"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block',
                  transition: 'all var(--transition-fast)',
                }}
                id={`job-card-${job.id}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{job.title}</h3>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-pill)',
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`,
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {job.status}
                      </span>
                      {isOwner && (
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-pill)',
                            background: 'rgba(6, 182, 212, 0.1)',
                            color: 'var(--accent-cyan)',
                            border: '1px solid rgba(6, 182, 212, 0.25)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                          }}
                        >
                          Your Post
                        </span>
                      )}
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {job.description}
                    </p>

                    {/* Skills */}
                    {job.skills && job.skills.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {job.skills.map((skill, i) => (
                          <span
                            key={i}
                            style={{
                              padding: '2px 10px',
                              borderRadius: 'var(--radius-pill)',
                              background: 'rgba(139, 92, 246, 0.08)',
                              color: 'var(--accent-purple)',
                              border: '1px solid rgba(139, 92, 246, 0.2)',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Meta info */}
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <DollarSign size={14} />
                        <strong style={{ color: 'var(--status-success)', fontSize: '0.92rem' }}>
                          {formatAmount(job.budget, job.asset_code)}
                        </strong>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={14} />
                        {job.applicationCount || 0} applicant{(job.applicationCount || 0) !== 1 ? 's' : ''}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={14} />
                        {formatRelativeTime(job.created_at)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        Posted by {truncateAddress(job.client_public_key, 4)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                    <ChevronRight size={20} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
