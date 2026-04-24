import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [timeZone, setTimeZone] = useState('');

  useEffect(() => {
    // Get local timezone
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimeZone(tz || 'Local Time');
    } catch (e) {
      setTimeZone('Local Time');
    }

    if (!targetDate) return;
    
    const target = new Date(targetDate).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      const diff = target - now;
      
      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Unlocked');
        return;
      }
      
      setIsExpired(false);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);
      
      setTimeLeft(parts.join(' '));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) return null;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 8px',
      background: isExpired ? 'rgba(16,185,129,0.1)' : 'rgba(56,189,248,0.1)',
      border: `1px solid ${isExpired ? 'rgba(16,185,129,0.2)' : 'rgba(56,189,248,0.2)'}`,
      borderRadius: 'var(--radius-sm)',
      fontSize: '0.75rem',
      fontWeight: 500,
      color: isExpired ? 'var(--status-success)' : 'var(--accent-cyan)',
      marginTop: '6px'
    }}>
      <Clock size={12} />
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{timeLeft}</span>
      <span style={{ 
        marginLeft: '4px', 
        fontSize: '0.65rem', 
        color: 'var(--text-tertiary)',
        borderLeft: `1px solid ${isExpired ? 'rgba(16,185,129,0.3)' : 'rgba(56,189,248,0.3)'}`,
        paddingLeft: '6px'
      }}>
        {timeZone}
      </span>
    </div>
  );
}
