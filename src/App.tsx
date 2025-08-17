import { useState } from 'react';
import './App.css';

function App() {
  const [emailText, setEmailText] = useState('');
  const [summary, setSummary] = useState('');

  const handleSummarize = async () => {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/meta-llama/Llama-3-8b-chat-hf",
      {
        headers: {
         Authorization: `Bearer ${import.meta.env.VITE_HUGGINGFACE_TOKEN}`, 
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: [
            {
              role: "system",
              content: "You are an assistant that summarizes emails concisely."
            },
            {
              role: "user",
              content: `Summarize this email: ${emailText}`
            }
          ],
          parameters: {
            max_new_tokens: 256,
            temperature: 0.7
          }
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      setSummary("Error: " + data.error);
    } else if (data.generated_responses) {
      // Some models return 'generated_responses' array
      setSummary(data.generated_responses[0]);
    } else if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
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
