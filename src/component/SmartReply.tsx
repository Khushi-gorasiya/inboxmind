import { useState, useEffect } from 'react';

interface Props {
  emailText: string;
}

function SmartReply({ emailText }: Props) {
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  const generateReply = async () => {
    if (!emailText.trim()) return;

    setLoading(true);
    setReply('');

    try {
      const res = await fetch('/api/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailText }),
      });

      const data = await res.json();
      if (data.reply) {
        setReply(data.reply);
      } else {
        setReply('No reply generated.');
      }
    } catch (err) {
      setReply('Error generating reply.');
    }

    setLoading(false);
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>✍️ Smart Reply</h3>
      <button onClick={generateReply} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Reply'}
      </button>

      {reply && (
        <div style={{ marginTop: '1rem', backgroundColor: '#eef', padding: '1rem' }}>
          <textarea value={reply} readOnly rows={4} style={{ width: '100%' }} />
          <br />
          <button onClick={() => navigator.clipboard.writeText(reply)}>📋 Copy</button>
          <a
            href={`mailto:?subject=RE: Your Email&body=${encodeURIComponent(reply)}`}
            style={{ marginLeft: '10px' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            ✉️ Open Gmail
          </a>
        </div>
      )}
    </div>
  );
}

export default SmartReply;
