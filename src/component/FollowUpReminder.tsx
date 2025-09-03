// src/component/FollowUpReminder.tsx
import { useEffect, useState } from 'react';

interface Props {
  emailText: string;
}

function formatDate(isoString: string | null) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '';
  }
}

function FollowUpReminder({ emailText }: Props) {
  const [loading, setLoading] = useState(false);
  const [needsFollowUp, setNeedsFollowUp] = useState(false);
  const [followUpBy, setFollowUpBy] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!emailText.trim()) {
      setNeedsFollowUp(false);
      setFollowUpBy(null);
      setReason('');
      setError('');
      return;
    }

    const detectFollowUp = async () => {
      setLoading(true);
      setError('');
      setNeedsFollowUp(false);
      setFollowUpBy(null);
      setReason('');

      try {
        const res = await fetch('/api/followup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailText }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to detect follow-up');
        }

        const data = await res.json();

        if (data.needsFollowUp) {
          setNeedsFollowUp(true);
          setFollowUpBy(data.followUpBy);
          setReason(data.reason);
        } else {
          setNeedsFollowUp(false);
          setFollowUpBy(null);
          setReason('');
        }
      } catch (err: any) {
        setError(err.message || 'Network error');
      } finally {
        setLoading(false);
      }
    };

    detectFollowUp();
  }, [emailText]);

  if (loading) return <div>Checking for follow-up requests...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!needsFollowUp) return null;

  return (
    <div
      style={{
        marginTop: '1rem',
        padding: '10px 15px',
        backgroundColor: '#ffecb3',
        borderRadius: '8px',
        border: '1px solid #fbc02d',
        color: '#5d4037',
      }}
    >
      <strong>⏰ Follow-up Requested!</strong>
      <p style={{ margin: '0.5rem 0' }}>{reason}</p>
      {followUpBy && (
        <p>
          Follow up by:{' '}
          <time dateTime={followUpBy} style={{ fontWeight: 'bold' }}>
            {formatDate(followUpBy)}
          </time>
        </p>
      )}
      {/* Optional: Add to Google Calendar button if followUpBy is valid */}
      {followUpBy && (
        <a
          href={`https://calendar.google.com/calendar/u/0/r/eventedit?text=Follow+up+email&dates=${followUpBy
            .replace(/[-:]/g, '')
            .split('.')[0]}/${new Date(new Date(followUpBy).getTime() + 3600000)
            .toISOString()
            .replace(/[-:]/g, '')
            .split('.')[0]}&details=${encodeURIComponent(
            reason
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            marginTop: '0.5rem',
            padding: '8px 12px',
            backgroundColor: '#fbc02d',
            color: '#5d4037',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 'bold',
          }}
        >
          ➕ Add Follow-up to Google Calendar
        </a>
      )}
    </div>
  );
}

export default FollowUpReminder;
