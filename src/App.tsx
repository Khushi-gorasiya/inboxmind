// src/App.tsx

import { useState } from 'react';
import SpamFlag from './component/SpamFlag';  // Make sure this path is correct

function App() {
  const [emailText, setEmailText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (!emailText.trim()) {
      // Do something for empty email
      return;
    }
    setLoading(true);
    try {
      // Call summarize API (if you have that part)
    } catch (err) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>Spam Detection App</h1>
      <textarea
        rows={6}
        value={emailText}
        onChange={(e) => setEmailText(e.target.value)}
        placeholder="Paste your email here"
      />
      <button onClick={handleSummarize} disabled={loading}>
        {loading ? 'Summarizing...' : 'Summarize Email'}
      </button>

      {/* Spam Detection */}
      <SpamFlag emailText={emailText} />
    </div>
  );
}

export default App;
