// src/component/SmartReply.tsx
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

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Reply generation failed.');
      setReply(data.reply || 'No reply generated.');
    } catch (err: any) {
      setError(err.message || '⚠️ Network error.');
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
  rows={8} // ⬅️ Increased from 4 to 8
  style={{
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    lineHeight: '1.6',
    borderRadius: '6px',
    border: '1px solid #aaa',
    resize: 'vertical',
    minHeight: '150px', // ⬅️ Add a minimum height
    backgroundColor: '#f9f9f9',
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
