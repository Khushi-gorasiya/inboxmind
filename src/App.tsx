import { useState, useEffect } from 'react';
import PriorityFlag from './component/PriorityFlag';
import SmartReply from './component/SmartReply';
import EventDetector from './component/EventDetector';
import SpamFlag from './component/SpamFlag';
import ToneAnalyzer from './component/ToneAnalyzer';
import FollowUpReminder from './component/FollowUpReminder';

function App() {
  const [emailText, setEmailText] = useState('');
  const [debouncedText, setDebouncedText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  // Simple debounce logic: wait 500ms after user stops typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedText(emailText);
    }, 500);

    // Cleanup timeout if emailText changes before 500ms
    return () => clearTimeout(handler);
  }, [emailText]);

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

    const text = await response.text();

    // Debug: log response text to see what we got
    console.log('Response text:', text);

    // Attempt to parse JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      // Not JSON: Check if it contains 504 Gateway Timeout message
      if (text.includes('504') || text.toLowerCase().includes('gateway timeout')) {
        setSummary('Error: The summarization service timed out. Please try again later.');
      } else {
        setSummary('Error: Unexpected response from the summarization service.');
      }
      setLoading(false);
      return;
    }

    // Handle JSON response
    if (!response.ok) {
      setSummary(`Error: ${data.error || 'Summarization failed.'}`);
    } else if (data.summary) {
      setSummary(data.summary);
    } else {
      setSummary('No summary returned.');
    }
  } catch (err: any) {
    setSummary(`Error: ${err.message || 'Failed to summarize email.'}`);
  }

  setLoading(false);
};

  
  return (
    <div
      style={{
        padding: '2rem',
        fontFamily: 'Segoe UI, sans-serif',
        backgroundColor: '#f7f9fc',
        minHeight: '100vh',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <h1
        style={{
          textAlign: 'center',
          fontSize: '2.5rem',
          color: '#333',
          marginBottom: '2rem',
        }}
      >
        InboxMind
      </h1>

      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <label htmlFor="emailInput" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
          Paste your email here:
        </label>
        <textarea
          id="emailInput"
          rows={10}
          placeholder="Paste your email here..."
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '16px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            marginTop: '8px',
            marginBottom: '20px',
            resize: 'vertical',
          }}
        />

        <button
          onClick={handleSummarize}
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '20px',
          }}
          disabled={loading}
        >
          {loading ? 'Summarizing...' : '📝 Summarize Email'}
        </button>

        {/* Summary Box */}
        <h3 style={{ marginTop: '2rem', fontSize: '20px' }}>🧾 Summary:</h3>
        <div
          style={{
            backgroundColor: '#fff',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            minHeight: '120px',
            marginTop: '10px',
            whiteSpace: 'pre-wrap',
            fontSize: '16px',
            lineHeight: '1.6',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          {summary}
        </div>

        {/* Pass debounced text to children */}
        <PriorityFlag emailText={debouncedText} />
        <SmartReply emailText={debouncedText} />
        <EventDetector emailText={debouncedText} />
        <SpamFlag emailText={debouncedText} />
        <ToneAnalyzer emailText={debouncedText} />
        <FollowUpReminder emailText={debouncedText} />
      </div>
    </div>
  );
}

export default App;
