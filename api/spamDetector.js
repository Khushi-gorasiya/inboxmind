import React, { useState } from 'react';

function SpamDetector() {
  const [emailText, setEmailText] = useState('');
  const [isSpam, setIsSpam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSpamDetection = async () => {
    if (!emailText.trim()) {
      return setError('Please enter an email to check.');
    }

    setLoading(true);
    setError('');
    setIsSpam(null);

    try {
      const res = await fetch('/api/spam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailText }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSpam(data.isSpam);
      } else {
        setError(data.error || 'Error detecting spam.');
      }
    } catch (err) {
      setError('Failed to detect spam.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ fontSize: '20px' }}>🚫 Spam Detection</h3>

      <textarea
        value={emailText}
        onChange={(e) => setEmailText(e.target.value)}
        placeholder="Paste your email here..."
        rows={6}
        style={{
          width: '100%',
          padding: '14px',
          fontSize: '16px',
          borderRadius: '6px',
          border: '1px solid #ccc',
          resize: 'vertical',
          minHeight: '120px',
        }}
      />

      <button
        onClick={handleSpamDetection}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#1976d2',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: '10px',
        }}
      >
        {loading ? 'Detecting...' : 'Check if Spam'}
      </button>

      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}

      {isSpam !== null && (
        <div style={{ marginTop: '20px' }}>
          <strong style={{ fontSize: '18px' }}>
            This email is {isSpam ? 'likely spam' : 'not spam'}.
          </strong>
        </div>
      )}
    </div>
  );
}

export default SpamDetector;
