// src/component/SmartReply.tsx
import React, { useState } from 'react';

interface SmartReplyProps {
  emailText: string;
}

const SmartReply: React.FC<SmartReplyProps> = ({ emailText }) => {
  const [reply, setReply] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReply = async () => {
    // Reset reply and error before starting
    setReply('');
    setError(null);

    if (!emailText.trim()) {
      setError(null); // No error if input is empty, just clear reply
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/smartReply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailText }),
      });

      const data = await response.json();

      if (!response.ok) {
        // API returned error
        setError(data.error || 'Failed to generate reply.');
      } else if (data.reply) {
        setReply(data.reply);
      } else {
        setError('No reply returned from the AI.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3>✍️ Smart Reply</h3>

      <button
        onClick={generateReply}
        disabled={loading || !emailText.trim()}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: loading || !emailText.trim() ? 'not-allowed' : 'pointer',
          backgroundColor: '#1976d2',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          marginBottom: '10px',
        }}
      >
        {loading ? 'Generating...' : 'Generate Reply'}
      </button>

      {/* Show error only if exists */}
      {error && (
        <p style={{ color: 'red', whiteSpace: 'pre-wrap' }}>
          Error: {error}
        </p>
      )}

      {/* Show reply only if exists */}
      {reply && (
        <div
          style={{
            whiteSpace: 'pre-wrap',
            backgroundColor: '#e3f2fd',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #90caf9',
          }}
        >
          {reply}
        </div>
      )}
    </div>
  );
};

export default SmartReply;
