import { useEffect, useState } from 'react';

interface Props {
  emailText: string;
}

function ToneAnalyzer({ emailText }: Props) {
  const [tone, setTone] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!emailText.trim()) {
      setTone('');
      setExplanation('');
      setError('');
      return;
    }

    const analyzeTone = async () => {
      setLoading(true);
      setError('');
      setTone('');
      setExplanation('');

      try {
        const res = await fetch('/api/toneAnalyzer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailText }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to analyze tone');
        }

        setTone(data.tone);
        setExplanation(data.explanation);
      } catch (err: any) {
        setError(err.message || 'Network error');
      } finally {
        setLoading(false);
      }
    };

    analyzeTone();
  }, [emailText]);

  if (loading) return <div>Analyzing tone...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!tone) return null;

  return (
    <div
      style={{
        marginTop: '1rem',
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: '#f0f4f8',
        border: '1px solid #ccc',
        fontSize: '16px',
      }}
    >
      <strong>Tone:</strong> {tone}
      <p style={{ marginTop: '8px' }}>{explanation}</p>
    </div>
  );
}

export default ToneAnalyzer;
