import { useState } from 'react';
import { postToAPI } from './utils/api';
import PriorityFlag from './components/PriorityFlag';
import SmartReply from './components/SmartReply';
import EventDetector from './components/EventDetector';
import SpamFlag from './components/SpamFlag';
import { useDebounce } from 'use-debounce';

function App() {
  const [emailText, setEmailText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [debouncedText] = useDebounce(emailText, 800);

  const handleSummarize = async () => {
    if (!emailText.trim()) {
      setSummary('Please enter an email to summarize.');
      return;
    }
    setLoading(true); setSummary('');
    try {
      const { summary } = await postToAPI('/api/summarize', { emailText });
      setSummary(summary);
    } catch (err: any) {
      setSummary(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f7f9fc', minHeight: '100vh', width: '100%', boxSizing: 'border-box' }}>
      <h1 style={{ textAlign: 'center', fontSize: '2.5rem', color: '#333', marginBottom: '2rem' }}>InboxMind</h1>
      <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        <label htmlFor="emailInput" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Paste your email here:</label>
        <textarea id="emailInput" rows={10} placeholder="Paste your email here..." value={emailText}
          onChange={(e) => setEmailText(e.target.value)} style={{ width: '100%', padding: '16px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '8px', marginBottom: '20px', resize: 'vertical' }} />

        <button onClick={handleSummarize} disabled={loading}
          style={{ display: 'inline-block', padding: '12px 24px', fontSize: '16px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '20px' }}>
          {loading ? 'Summarizing...' : '📝 Summarize Email'}
        </button>

        <h3 style={{ marginTop: '2rem', fontSize: '20px' }}>🧾 Summary:</h3>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '120px', marginTop: '10px', whiteSpace: 'pre-wrap', fontSize: '16px', lineHeight: '1.6', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
          {summary}
        </div>

        <PriorityFlag emailText={debouncedText} />
        <SmartReply emailText={debouncedText} />
        <EventDetector emailText={debouncedText} />
        <SpamFlag emailText={debouncedText} />
      </div>
    </div>
  );
}

export default App;
