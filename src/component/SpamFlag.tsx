import React, { useState, useEffect } from 'react';

interface Props {
  emailText: string;
}

const SpamFlag: React.FC<Props> = ({ emailText }) => {
  const [spamStatus, setSpamStatus] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rawResponse, setRawResponse] = useState(''); // For debugging

  function extractJSON(text: string): string | null {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/i);
    return match ? match[1].trim() : null;
  }

  function cleanResponse(text: string): string {
    let cleaned = text;
    cleaned = cleaned.replace(/<\/?[^>]+(>|$)/g, '');
    cleaned = cleaned.replace(/\[[^\]]+\]/g, '');
    return cleaned.trim();
  }

  useEffect(() => {
    if (!emailText.trim()) {
      setSpamStatus('');
      setReason('');
      setError('');
      setRawResponse('');
      return;
    }

    const checkSpam = async () => {
      setLoading(true);
      setError('');
      setRawResponse('');
      try {
        const res = await fetch('/api/spamdetector', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailText }),
        });

        const rawText = await res.text();
        setRawResponse(rawText);
        console.log('Raw spamdetector response:', rawText);

        if (!res.ok) {
          // Try parse error JSON
          let errorData;
          try {
            errorData = JSON.parse(rawText);
            setError(errorData.error || 'Unknown error detecting spam');
          } catch {
            setError(rawText || 'Unknown error detecting spam');
          }
          setSpamStatus('');
          setReason('');
          setLoading(false);
          return;
        }

        // Try to parse JSON normally
        let jsonString = extractJSON(rawText);
        if (!jsonString) {
          const cleanedText = cleanResponse(rawText);
          try {
            JSON.parse(cleanedText);
            jsonString = cleanedText;
          } catch {
            setError('Invalid JSON: Could not find or parse JSON data in response');
            setSpamStatus('');
            setReason('');
            setLoading(false);
            return;
          }
        }

        let data;
        try {
          data = JSON.parse(jsonString);
        } catch {
          setError('Invalid JSON: Failed to parse JSON data');
          setSpamStatus('');
          setReason('');
          setLoading(false);
          return;
        }

        setSpamStatus(data.label);
        setReason(data.reason);
        setError('');
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
      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          Error: {error}
          {rawResponse && (
            <>
              <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
                Raw API Response (for debugging):
              </div>
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  backgroundColor: '#fdd',
                  padding: '10px',
                  borderRadius: '6px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  fontSize: '14px',
                }}
              >
                {rawResponse}
              </pre>
            </>
          )}
        </div>
      )}

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
          {reason && <div style={{ marginTop: '0.5rem', fontWeight: 'normal' }}>{reason}</div>}
        </div>
      )}
    </div>
  );
};

export default SpamFlag;
