// src/component/ToneAnalyzer.tsx
import { useEffect, useState } from 'react';

interface Props {
  emailText: string;
}

// Simple helper to strip HTML tags
function stripHtmlTags(input: string) {
  return input.replace(/<\/?[^>]+(>|$)/g, '');
}

// Optional: clean common markdown-like artifacts (you can customize)
function cleanText(input: string) {
  let cleaned = input;

  // Remove strike-through markdown tags like <s>...</s> or ~~~
  cleaned = cleaned.replace(/<\/?s>/g, '');
  cleaned = cleaned.replace(/~~/g, '');

  // Remove [OUT] or similar bracketed tags if you want
  cleaned = cleaned.replace(/\[.*?\]/g, '');

  // Remove leftover multiple spaces/newlines
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  return cleaned;
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

        // Sanitize the tone and explanation before setting
        setTone(cleanText(stripHtmlTags(data.tone || '')));
        setExplanation(cleanText(stripHtmlTags(data.explanation || '')));
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
