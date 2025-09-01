import React, { useState, useEffect } from 'react';

interface Props {
  emailText: string;
}

const SpamFlag: React.FC<Props> = ({ emailText }) => {
  const [spamStatus, setSpamStatus] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!emailText.trim()) {
      setSpamStatus('');
      setReason('');
      setError('');
      return;
    }

    const checkSpam = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/spamdetector', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailText }),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Error detecting spam');

        setSpamStatus(data.spamStatus);
        setReason(data.reason);
      } catch (err: any) {
        setError(err.message);
        setSpamStatus('');
        setReason('');
      } finally {
        setLoading(false);
      }
    };

    checkSpam();
  }, [emailText]);

  if (loading) return <div>Checking spam status...</div>;

  return (
    <div>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {!error && spamStatus && (
        <div
          style={{
            marginTop: '1rem',
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: spamStatus === 'Spam' ? '#e53935' : '#4caf50',
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          {spamStatus === 'Spam' ? '⚠️ Spam Detected' : '✅ Not Spam'}
          {reason && (
            <div style={{ marginTop: '0.5rem', fontWeight: 'normal' }}>{reason}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpamFlag;
