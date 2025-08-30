// src/component/SpamFlag.tsx

import { useState, useEffect } from 'react';

interface Props {
  emailText: string;
}

const SpamFlag: React.FC<Props> = ({ emailText }) => {
  const [spamStatus, setSpamStatus] = useState<string>('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!emailText.trim()) {
      setSpamStatus('');
      setConfidence(null);
      return;
    }

    const checkSpam = async () => {
      setLoading(true);
      setError('');
      setSpamStatus('');

      try {
        const res = await fetch('/api/spamdetector', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailText }),
        });

        const data = await res.json();
        setSpamStatus(data.spam || 'Unknown');
        setConfidence(data.confidence || null);
      } catch (err) {
        setError('Error detecting spam');
        setSpamStatus('');
      } finally {
        setLoading(false);
      }
    };

    checkSpam();
  }, [emailText]);

  if (loading) return <div>Checking for spam...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div>
      {spamStatus && (
        <div
          style={{
            backgroundColor: spamStatus === 'Spam' ? '#e53935' : '#81c784',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '16px',
            fontWeight: 'bold',
            display: 'inline-block',
            marginTop: '10px',
          }}
        >
          {spamStatus} {confidence && `(${Math.round(confidence * 100)}%)`}
        </div>
      )}
    </div>
  );
};

export default SpamFlag;

