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
        // Hugging Face Model API URL for spam detection (use your own model URL)
        const response = await fetch('https://api-inference.huggingface.co/models/your-huggingface-model', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer YOUR_HUGGINGFACE_API_KEY`, // Replace with your Hugging Face API key
          },
          body: JSON.stringify({ inputs: emailText }),
        });

        const data = await response.json();
        if (!response.ok) {
          setError(data.error || 'Failed to detect spam.');
        } else {
          // Assuming the model returns a label (Spam / Not Spam) in the response
          const spamPrediction = data[0]?.label || 'Unknown';
          setSpamStatus(spamPrediction);
        }
      } catch (err: any) { // Handle unknown errors
        setError(err.message || 'Network error');
      } finally {
        setLoading(false);
      }
    };

    checkSpam();
  }, [emailText]);

  if (loading) return <div>Loading...</div>;

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
        </div>
      )}
    </div>
  );
};

export default SpamFlag;
