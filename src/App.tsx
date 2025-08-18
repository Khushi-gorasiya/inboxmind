import { useState } from 'react';
import PriorityFlag from './components/PriorityFlag';

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
    <div className="App" style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>InboxMind</h1>

      <textarea
        rows={10}
        cols={60}
        placeholder="Paste your email here..."
        value={emailText}
        onChange={(e) => setEmailText(e.target.value)}
        style={{ padding: '10px', fontSize: '16px', width: '100%', boxSizing: 'border-box' }}
      />

      <br />

      <button
        onClick={handleSummarize}
        style={{ marginTop: '10px', padding: '10px 20px', fontSize: '16px' }}
        disabled={loading}
      >
        {loading ? 'Summarizing...' : 'Summarize Email'}
      </button>

      <PriorityFlag emailText={emailText} />  // putting by my own. need to be remove maybe.

      <h3 style={{ marginTop: '2rem' }}>Summary:</h3>
      <div
        style={{
          backgroundColor: '#f5f5f5',
          padding: '10px',
          minHeight: '100px',
          whiteSpace: 'pre-wrap',
        }}
      >
        {summary}
      </div>
    </div>
  );
}

export default App;
