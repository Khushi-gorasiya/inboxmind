import React, { useState, useEffect } from 'react';

interface Props {
  emailText: string;
}

const SpamFlag: React.FC<Props> = ({ emailText }) => {
  const [spamStatus, setSpamStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!emailText.trim()) {
      setSpamStatus('');
      setError('');
      return;
    }

    const checkSpam = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/spamdetector', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailText }),
        });

        const text = await response.text();
        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('Invalid JSON response: ' + text);
        }

        if (!response.ok) {
          throw new Error(data.error || 'Error detecting spam');
        }

        setSpamStatus(data.spamStatus || 'Unknown');
      } catch (err: any) {
        setError(err.message || 'Network error');
        setSpamStatus('');
      } finally {
        setLoading(false);
      }
    };

    checkSpam();
  }, [emailText]);

  if (loading) return <div>Checking spam...</div>;

  return (
    <div>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {!error && spamStatus && (
        <div
          style={{
            marginTop: '1rem',
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: spamStatus.toLowerCase() === 'spam' ? '#e53935' : '#4caf50',
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          {spamStatus.toLowerCase() === 'spam' ? '⚠️ Spam Detected' : '✅ Not Spam'}
        </div>
      )}
    </div>
  );
};

export default SpamFlag;
