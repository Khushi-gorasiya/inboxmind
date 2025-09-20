// src/component/ToneAnalyzer.tsx
import { useEffect, useState } from 'react';

interface Props {
  emailText: string;
}

interface ToneData {
  tone: string;
  explanation: string;
}

function ToneAnalyzer({ emailText }: Props) {
  const [tone, setTone] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper to extract JSON from markdown code block
  function extractJSON(text: string): string | null {
    // Matches ```json ... ```
    const match = text.match(/```json\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      return match[1].trim();
    }
    return null;
  }

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

        const text = await res.text();

        if (!res.ok) {
          throw new Error(text || 'Failed to analyze tone');
        }

        // Extract JSON string from markdown block
        const jsonString = extractJSON(text);

        if (!jsonString) {
          throw new Error('Could not find JSON data in response');
        }

        let data: ToneData;
        try {
          data = JSON.parse(jsonString);
        } catch {
          throw new Error('Invalid JSON format in response');
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
