import React, { useState, useEffect } from 'react';

interface Props { emailText: string; }

const SpamFlag: React.FC<Props> = ({ emailText }) => {
  const [spamStatus, setSpamStatus] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!emailText.trim()) {
      setSpamStatus('');
      setConfidence(null);
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

        if (!res.ok) throw new Error(data.error || 'Failed to detect spam');

        setSpamStatus(data.spamStatus);
        setConfidence(data.confidence);
      } catch (err: any) {
        setError(err.message);
        setSpamStatus('');
        setConfidence(null);
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
        <div style={{
          marginTop: '1rem',
          padding: '10px',
          borderRadius: '8px',
          backgroundColor: spamStatus === 'spam' ? '#e53935' : '#4caf50',
          color: 'white',
          fontWeight: 'bold',
        }}>
          {spamStatus === 'spam' ? '⚠️ Spam Detected' : '✅ Not Spam'}
          {confidence !== null && ` (${(confidence * 100).toFixed(1)}%)`}
        </div>
      )}
    </div>
  );
};

export default SpamFlag;
