import { useState, useEffect } from 'react';

interface Props {
  emailText: string;
}

function SpamFlag({ emailText }: Props) {
  const [isSpam, setIsSpam] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!emailText.trim()) {
      setIsSpam(false);
      setError('');
      return;
    }

    const checkSpam = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/spamDetector', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailText }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Error detecting spam.');
          setIsSpam(false);
        } else {
          setIsSpam(data.isSpam);
        }
      } catch (err) {
        setError('Network error');
        setIsSpam(false);
      } finally {
        setLoading(false);
      }
    };

    checkSpam();
  }, [emailText]);

  const spamColor = isSpam ? '#e53935' : '#9e9e9e'; // Red for spam, gray for not spam

  if (loading) return <div>Checking for spam...</div>;

  return (
    <div style={{ marginTop: '1rem' }}>
      {error ? (
        <div style={{ color: 'red' }}>Error: {error}</div>
      ) : (
        <div
          style={{
            display: 'inline-block',
            backgroundColor: spamColor,
            color: 'white',
            padding: '5px 12px',
            borderRadius: '16px',
            fontWeight: 'bold',
          }}
        >
          {isSpam ? 'Spam' : 'Not Spam'}
        </div>
      )}
    </div>
  );
}

export default SpamFlag;
