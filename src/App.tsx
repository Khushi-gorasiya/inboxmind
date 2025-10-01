// src/App.tsx
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

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedText(emailText);
    }, 500);
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

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        setSummary(
          text.includes('504')
            ? '⚠️ Error: The summarization service timed out. Please try again shortly.'
            : '⚠️ Error: Unexpected error from the summarization service.'
        );
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        setSummary(`Error: ${data.error || 'Summarization failed.'}`);
      } else if (data.summary) {
        setSummary(data.summary);
      } else {
        setSummary('No summary returned.');
      }
    } catch (err: any) {
      setSummary(`Error: ${err.message || 'Failed to summarize email.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        overflowY: 'auto',
        backgroundColor: '#ffffff',
        padding: '2rem',
        boxSizing: 'border-box',
        fontFamily: 'Segoe UI, sans-serif',
      }}
    >
      <h1 style={{ textAlign: 'center', fontSize: '2.5rem', color: '#222' }}>
        InboxMind
      </h1>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Email Input */}
        <div style={cardStyle}>
          <label htmlFor="emailInput" style={{ fontWeight: 600, fontSize: '1.1rem' }}>
            Paste your email here:
          </label>
          <textarea
            id="emailInput"
            rows={8}
            placeholder="Paste your email here..."
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              marginTop: '10px',
              resize: 'vertical',
            }}
          />
          <button
            onClick={handleSummarize}
            style={{
              marginTop: '12px',
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            disabled={loading}
          >
            {loading ? 'Summarizing...' : '📝 Summarize Email'}
          </button>
        </div>

        {/* Summary Output */}
        {summary && (
          <div style={cardStyle}>
            <h3>🧾 Summary:</h3>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{summary}</p>
          </div>
        )}

        {/* Feature Cards */}
        <div style={cardStyle}>
          <PriorityFlag emailText={debouncedText} />
        </div>

        <div style={cardStyle}>
          <SmartReply emailText={debouncedText} />
        </div>

        <div style={cardStyle}>
          <EventDetector emailText={debouncedText} />
        </div>

        <div style={cardStyle}>
          <SpamFlag emailText={debouncedText} />
        </div>

        <div style={cardStyle}>
          <ToneAnalyzer emailText={debouncedText} />
        </div>

        <div style={cardStyle}>
          <FollowUpReminder emailText={debouncedText} />
        </div>
      </div>
    </div>
  );
}

// Reusable card style for each feature
const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #e0e0e0',
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
  marginTop: '20px',
};

export default App;
