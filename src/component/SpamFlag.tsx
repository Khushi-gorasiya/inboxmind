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

  // Helper to extract JSON string from API response text
  function extractJSON(text: string): string | null {
    // Try to extract JSON block inside ```json ... ```
    const jsonBlock = text.match(/```json\s*([\s\S]*?)\s*```/i);
    if (jsonBlock && jsonBlock[1]) {
      return jsonBlock[1].trim();
    }

    // Fallback: try to find JSON object in the text directly
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    return null;
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
          // Try parse error from response JSON
          let errMsg = text;
          try {
            const errJson = JSON.parse(text);
            if (errJson.error) errMsg = errJson.error;
          } catch {
            // ignore parse error here
          }
          throw new Error(errMsg || 'Error detecting spam');
        }

        // Extract JSON from response text
        const jsonString = extractJSON(text);
        if (!jsonString) {
          throw new Error('Invalid JSON: Could not find JSON data in response');
        }

        let data: SpamResponse;
        try {
          data = JSON.parse(jsonString);
        } catch (e) {
          throw new Error('Invalid JSON: Could not parse JSON data');
        }

        setSpamStatus(data.label);
        setReason(data.reason);
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
