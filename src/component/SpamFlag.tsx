import React, { useState, useEffect } from 'react';

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
      setError('');
      return;
    }

    const checkSpam = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(
          'https://api-inference.huggingface.co/models/mrm8488/bert-tiny-finetuned-sms-spam-detection',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer VITE_HUGGINGFACE_TOKEN`, // Replace with your API key
            },
            body: JSON.stringify({ inputs: emailText }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || 'Failed to fetch spam status');
        }

        const data = await response.json();

        // The model returns an array like: [{label: 'spam', score: 0.95}, {label: 'ham', score: 0.05}]
        if (Array.isArray(data) && data.length > 0) {
          // Find spam or ham label with highest score
          const spamLabel = data.reduce((prev, curr) =>
            curr.score > prev.score ? curr : prev
          );
          setSpamStatus(spamLabel.label === 'ham' ? 'Not Spam' : 'Spam');
          setConfidence(spamLabel.score);
        } else {
          setSpamStatus('Unknown');
          setConfidence(null);
        }
      } catch (err: any) {
        setError(err.message || 'Network error');
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
          {spamStatus === 'Spam' ? '⚠️ Spam Detected' : '✅ Not Spam'}
          {confidence !== null ? ` (${(confidence * 100).toFixed(1)}%)` : ''}
        </div>
      )}
    </div>
  );
};

export default SpamFlag;
