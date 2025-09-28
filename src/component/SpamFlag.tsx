import React, { useState, useEffect } from 'react';

interface Props {
  emailText: string;
}

interface SpamResponse {
  label: string;
  reason: string;
}

const SpamFlag: React.FC<Props> = ({ emailText }) => {
  const [spamStatus, setSpamStatus] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Robust JSON extraction function
  function extractAndParseJSON(rawText: string): SpamResponse {
    if (!rawText) throw new Error('Empty response');

    // Try direct parse
    try {
      return JSON.parse(rawText);
    } catch {}

    // Try extracting JSON inside ```json ... ```
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/i);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {}
    }

    // Remove known noise tokens and try again
    const cleaned = rawText
      .replace(/<[^>]+>/g, '')    // remove tags like <s>
      .replace(/\[.*?\]/g, '')    // remove [OUT] etc.
      .replace(/```json|```/gi, '') // remove markdown fences
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch (err) {
      throw new Error('Could not find JSON data in response');
    }
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
      setSpamStatus('');
      setReason('');

      try {
        const res = await fetch('/api/spamdetector', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailText }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Error detecting spam');
        }

        const data = await res.json();

        // DEBUG: log raw response from backend
        console.log('Raw response from API:', data.rawResponse);

        const parsed = extractAndParseJSON(data.rawResponse);

        setSpamStatus(parsed.label);
        setReason(parsed.reason);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
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
