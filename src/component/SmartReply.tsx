import { useState } from 'react';

interface Props {
  emailText: string;
}

function SmartReply({ emailText }: Props) {
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateReply = async () => {
    if (!emailText.trim()) {
      setError('Please enter an email first.');
      return;
    }

    setLoading(true);
    setReply('');
    setError('');

    try {
      const res = await fetch('/api/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailText }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate reply.');
      }

      const data = await res.json();
      setReply(data.reply || 'No reply generated.');
    } catch (err: any) {
      setError(err.message || '⚠️ Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ fontSize: '20px' }}>✍️ Smart Reply</h3>
      <button
        onClick={generateReply}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#1976d2',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Generating Reply...' : 'Generate Reply'}
      </button>

      {error && (
        <div style={{ marginTop: '1rem', color: '#d32f2f' }}>
          ⚠️ {error}
        </div>
      )}

      {reply && !error && (
        <div
          style={{
            marginTop: '1rem',
            backgroundColor: '#e3f2fd',
            padding: '1rem',
            borderRadius: '8px',
            boxShadow: '0 0 8px rgba(0,0,0,0.05)',
          }}
        >
          <textarea
            value={reply}
            readOnly
            rows={4}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              resize: 'vertical',
            }}
          />
          <div style={{ marginTop: '0.5rem' }}>
            <button
              onClick={() => navigator.clipboard.writeText(reply)}
              style={{
                marginRight: '10px',
                padding: '8px 12px',
                backgroundColor: '#4caf50',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
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
                padding: '8px 12px',
                backgroundColor: '#f9a825',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '4px',
              }}
            >
              ✉️ Open Gmail
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default SmartReply;
