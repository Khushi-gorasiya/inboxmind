import { useState } from 'react';

interface Props {
  emailText: string;
}

function SmartReply({ emailText }: Props) {
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateReply = async () => {
    if (!emailText.trim()) return;

    setLoading(true);
    setReply('');
    setError('');

    try {
      const res = await fetch('/api/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailText }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate reply');
      }

      setReply(data.reply);
    } catch (err: any) {
      setError(err.message || 'Unexpected error occurred');
    }

    setLoading(false);
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>✍️ Smart Reply</h3>
      <button
        onClick={generateReply}
        disabled={loading}
        style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        {loading ? 'Generating...' : 'Generate Reply'}
      </button>

      {error && (
        <div style={{ color: 'red', marginTop: '1rem' }}>
          ⚠️ {error}
        </div>
      )}

      {reply && (
        <div
          style={{
            marginTop: '1rem',
            backgroundColor: '#e0f7fa',
            padding: '1rem',
            borderRadius: '8px',
          }}
        >
          <textarea
            value={reply}
            readOnly
            rows={4}
            style={{ width: '100%', fontSize: '14px', padding: '8px' }}
          />
          <br />
          <button
            onClick={() => navigator.clipboard.writeText(reply)}
            style={{
              marginTop: '0.5rem',
              marginRight: '10px',
              padding: '6px 12px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            📋 Copy
          </button>
          <a
            href={`mailto:?subject=RE: Your Email&body=${encodeURIComponent(reply)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '6px 12px',
              backgroundColor: '#ff9800',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
            }}
          >
            ✉️ Open Gmail
          </a>
        </div>
      )}
    </div>
  );
}

export default SmartReply;
