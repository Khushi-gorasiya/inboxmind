import { useState } from 'react';
import PriorityFlag from './component/PriorityFlag';
import SmartReply from './component/SmartReply';

function App() {
  const [emailText, setEmailText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (!emailText.trim()) {
      setSummary('Please enter an email to summarize.');
      return;
    }

    setLoading(true);
    setSummary('');

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailText }),
      });

      const data = await response.json();

      if (data.error) {
        setSummary(`Error: ${data.error}`);
      } else if (data.summary) {
        setSummary(data.summary);
      } else {
        setSummary('No summary returned.');
      }
    } catch (err) {
      setSummary('Failed to summarize email.');
    }

    setLoading(false);
  };

  return (
    <div
      className="App"
      style={{
        padding: '2rem',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '1200px', // Max width for large screens
        margin: '0 auto', // Center horizontally
        width: '95%', // Almost full width on small screens
        boxSizing: 'border-box',
      }}
    >
      <h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>InboxMind</h1>

      <textarea
        rows={12}
        placeholder="Paste your email here..."
        value={emailText}
        onChange={(e) => setEmailText(e.target.value)}
        style={{
          padding: '12px',
          fontSize: '16px',
          width: '100%',
          boxSizing: 'border-box',
          borderRadius: '8px',
          border: '1px solid #ccc',
          resize: 'vertical',
          minHeight: '200px',
          marginBottom: '1rem',
          fontFamily: 'inherit',
        }}
      />

      <button
        onClick={handleSummarize}
        disabled={loading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'block',
          marginBottom: '1.5rem',
          width: '100%',
          maxWidth: '300px',
          marginLeft: 'auto',
          marginRight: 'auto',
          boxShadow: '0 4px 10px rgba(25, 118, 210, 0.4)',
        }}
      >
        {loading ? 'Summarizing...' : 'Summarize Email'}
      </button>

      <PriorityFlag emailText={emailText} />
      <SmartReply emailText={emailText} />

      <h3 style={{ marginTop: '2rem', textAlign: 'center' }}>📝 Summary:</h3>
      <div
        style={{
          backgroundColor: '#f5f5f5',
          padding: '16px',
          minHeight: '150px',
          whiteSpace: 'pre-wrap',
          borderRadius: '8px',
          fontSize: '16px',
          lineHeight: '1.5',
          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          width: '100%',
          boxSizing: 'border-box',
          marginTop: '0.5rem',
        }}
      >
        {summary}
      </div>
    </div>
  );
}

export default App;
