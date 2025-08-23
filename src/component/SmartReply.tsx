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

      if (data.error) {
        setError('⚠️ Failed to generate reply.');
        return;
      }

      setReply(data.reply || 'No reply generated.');
    } catch (err) {
      setError('⚠️ Network error. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>✍️ Smart Reply Generator</h3>

      <button
        onClick={generateReply}
        disabled={loading}
        style={{
          padding: '10px 18px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Generating...' : 'Generate Reply'}
      </button>

      {error && (
        <div style={{ marginTop: '1rem', color: 'red' }}>
          {error}
        </div>
      )}

      {reply && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#f0f8ff',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <textarea
            value={reply}
            readOnly
            rows={5}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '15px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              resize: 'vertical',
              backgroundColor: '#fff',
            }}
          />
          <div style={{ marginTop: '0.75rem' }}>
            <button
              onClick={() => navigator.clipboard.writeText(reply)}
              style={{
                padding: '8px 14px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                marginRight: '10px',
                cursor: 'pointer',
              }}
            >
              📋 Copy to Clipboard
            </button>
            <a
              href={`mailto:?subject=RE: Your Email&body=${encodeURIComponent(reply)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 14px',
                backgroundColor: '#17a2b8',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px',
              }}
            >
              ✉️ Open in Gmail
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default SmartReply;
