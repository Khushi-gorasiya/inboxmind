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

  // Clean unwanted tokens and extract JSON inside markdown fences
  function extractAndParseJSON(rawText: string): SpamResponse {
    // Step 1: Remove known noise tokens and tags
    let cleaned = rawText
      .replace(/<[^>]+>/g, '')  // Remove any HTML-like tags e.g. <s>
      .replace(/\[OUT\]/gi, '') // Remove [OUT]
      .replace(/\[\/?INST\]/gi, '') // Remove [INST] or [/INST]
      .trim();

    // Step 2: Extract JSON inside ```json ... ```
    const jsonMatch = cleaned.match(/```json\s*([\s\S]*?)```/i);

    if (!jsonMatch || !jsonMatch[1]) {
      throw new Error('Could not find JSON data in response');
    }

    const jsonString = jsonMatch[1].trim();

    // Step 3: Parse JSON safely
    try {
      const parsed = JSON.parse(jsonString);
      return parsed;
    } catch (err) {
      throw new Error('Invalid JSON format in response');
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

        const text = await res.text();

        if (!res.ok) {
          // Try parse error message from JSON error response
          let errMsg = text;
          try {
            const errJson = JSON.parse(text);
            if (errJson.error) errMsg = errJson.error;
          } catch {
            // ignore parse error here
          }
          throw new Error(errMsg || 'Error detecting spam');
        }

        // Extract & parse JSON response
        const data = extractAndParseJSON(text);

        // For spam API, keys might be 'label' or something else; adapt accordingly
        setSpamStatus(data.label || '');
        setReason(data.reason || '');
      } catch (err: any) {
        setError(err.message || 'Network error');
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
