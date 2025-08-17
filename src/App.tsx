import { useState } from 'react';

function App() {
  const [emailText, setEmailText] = useState('');
  const [summary, setSummary] = useState('');

  const handleSummarize = async () => {
    const response = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailText }),
    });

    const data = await response.json();

    if (data.error) {
      setSummary("Error: " + data.error);
    } else if (data.generated_responses) {
      setSummary(data.generated_responses[0]);
    } else if (Array.isArray(data) && data[0]?.generated_text) {
      setSummary(data[0].generated_text);
    } else {
      setSummary("No summary returned.");
    }
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
      >
        Summarize Email
      </button>

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
