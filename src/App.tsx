// src/App.tsx

import { useState } from 'react';
import PriorityFlag from './component/PriorityFlag';
import SmartReply from './component/SmartReply';
import EventDetector from './component/EventDetector';
import SpamFlag from './component/SpamFlag';  // Import the SpamFlag component

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
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>InboxMind</h1>
      <label htmlFor="emailInput">Paste your email here:</label>
      <textarea
        id="emailInput"
        rows={10}
        placeholder="Paste your email here..."
        value={emailText}
        onChange={(e) => setEmailText(e.target.value)}
      />
      <button onClick={handleSummarize} disabled={loading}>
        {loading ? 'Summarizing...' : '📝 Summarize Email'}
      </button>

      {/* Summary Section */}
      <h3>🧾 Summary:</h3>
      <div>{summary}</div>

      {/* Priority Flag */}
      <PriorityFlag emailText={emailText} />

      {/* Smart Reply Generator */}
      <SmartReply emailText={emailText} />

      {/* Event Detector */}
      <EventDetector emailText={emailText} />

      {/* Spam Detection Feature */}
      <SpamFlag emailText={emailText} />
    </div>
  );
}

export default App;
