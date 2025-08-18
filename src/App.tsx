import { useState } from 'react';

function App() {
  const [emailText, setEmailText] = useState('');
  const [summary, setSummary] = useState('');

  const handleSummarize = async () => {
    setSummary("Summarizing...");

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailText }),
      });

      const data = await response.json();

      if (data.error) {
        setSummary("Error: " + data.error);
      } else if (Array.isArray(data) && data[0]?.generated_text) {
        setSummary(data[0].generated_text);
      } else {
        setSummary("No summary returned.");
      }
    } catch (error) {
      console.error("Summarization failed:", error);
      setSummary("Failed to summarize. Please try again later.");
    }
  };

  return (
    <div className="App" style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>📬 InboxMind</h1>

      <textarea
        rows={10}
        cols={60}
        placeholder="Paste your email here..."
        value={emailText}
        onChange={(e) => setEmailText(e.target.value)}
        style={{
          padding: '10px',
          fontSize: '16px',
          width: '100%',
          boxSizing: 'border-box',
          marginBottom: '10px',
        }}
      />

      <button
        onClick={handleSummarize}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
        }}
      >
        Summarize Email
      </button>

      <h3 style={{ marginTop: '2rem' }}>📝 Summary:</h3>
      <div
        style={{
          backgroundColor: '#f5f5f5',
          padding: '10px',
          minHeight: '100px',
          whiteSpace: 'pre-wrap',
          borderRadius: '4px',
        }}
      >
        {summary}
      </div>
    </div>
  );
}

export default App;
