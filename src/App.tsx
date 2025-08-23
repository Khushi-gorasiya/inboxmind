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
        maxWidth: '800px',
        margin: '2rem auto',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: '#333',
      }}
    >
      <h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>InboxMind</h1>

      <textarea
        rows={10}
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
          fontFamily: 'inherit',
        }}
      />

      <button
        onClick={handleSummarize}
        disabled={loading}
        style={{
          marginTop: '1rem',
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: '600',
          color: 'white',
          backgroundColor: '#007bff',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.3s ease',
        }}
        onMouseEnter={(e) => {
          if (!loading) e.currentTarget.style.backgroundColor = '#0056b3';
        }}
        onMouseLeave={(e) => {
          if (!loading) e.currentTarget.style.backgroundColor = '#007bff';
        }}
      >
        {loading ? 'Summarizing...' : 'Summarize Email'}
      </button>

      {/* Priority Tag */}
      <PriorityFlag emailText={emailText} />

      {/* Summary Section */}
      <section
        style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          minHeight: '120px',
          whiteSpace: 'pre-wrap',
          boxShadow: 'inset 0 0 5px #ccc',
          fontSize: '15px',
          lineHeight: '1.5',
          color: summary.startsWith('Error') || summary === 'Failed to summarize email.' ? '#d9534f' : '#333',
        }}
      >
        <h3>Summary:</h3>
        {summary || 'Your summary will appear here.'}
      </section>

      {/* Smart Reply */}
      <SmartReply emailText={emailText} />
    </div>
  );
}

export default App;
