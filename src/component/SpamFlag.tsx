// src/component/SpamFlag.tsx
import React, { useState, useEffect } from 'react';

interface Props {
  emailText: string;
}

const SpamFlag: React.FC<Props> = ({ emailText }) => {
  const [spamStatus, setSpamStatus] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper to extract JSON from markdown code block
  function extractJSON(text: string): string | null {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/i);
    return match ? match[1].trim() : null;
  }

  // Helper to clean unwanted tags like <s>, [/INST], etc.
  function cleanResponse(text: string): string {
    let cleaned = text;

    // Remove HTML-like tags e.g., <s>
    cleaned = cleaned.replace(/<\/?[^>]+(>|$)/g, '');

    // Remove bracketed tokens e.g., [/INST], [OUT], etc.
    cleaned = cleaned.replace(/\[[^\]]+\]/g, '');

    return cleaned.trim();
  }

  useEffect(() => {
    if (!emailText.trim()) {
      setSpamStatus('');
      setReason('');
      setError('');
      return;
    }

    const checkSpam = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/spamdetector', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailText }),
        });

        const rawText = await res.text();

        if (!res.ok) throw new Error(rawText || 'Error detecting spam');

        // Log raw response for debugging
        console.log('Raw spamdetector response:', rawText);

        // Try extracting JSON block from markdown
        let jsonString = extractJSON(rawText);

        if (!jsonString) {
          // If no JSON block, try cleaning and parsing entire response as JSON
          const cleanedText = cleanResponse(rawText);

          try {
            JSON.parse(cleanedText);
            jsonString = cleanedText;
          } catch {
            throw new Error('Invalid JSON: Could not find or parse JSON data in response');
          }
        }

        let data;
        try {
          data = JSON.parse(jsonString);
        } catch {
          throw new Error('Invalid JSON: Failed to parse JSON data');
        }

        setSpamStatus(data.label);
        setReason(data.reason);
      } catch (err: any) {
        setError(err.message);
        setSpamStatus('');
        setReason('');
      } finally {
        setLoading(false);
      }
    };

    checkSpam();
  }, [emailText]);

  if (loading) return <div>Checking spam status...</div>;

  return (
    <div>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {!error && spamStatus && (
        <div
          style={{
            marginTop: '1rem',
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: spamStatus === 'Spam' ? '#e53935' : '#4caf50',
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          {spamStatus === 'Spam' ? '⚠️ Spam Detected' : '✅ Not Spam'}
          {reason && (
            <div style={{ marginTop: '0.5rem', fontWeight: 'normal' }}>{reason}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpamFlag;
