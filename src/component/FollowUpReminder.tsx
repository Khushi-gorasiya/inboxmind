// src/component/FollowUpReminder.tsx
import { useEffect, useState } from 'react';

interface Props {
  emailText: string;
}

interface FollowUpData {
  needsFollowUp: boolean;
  followUpBy: string;
  reason: string;
}

function FollowUpReminder({ emailText }: Props) {
  const [followUpData, setFollowUpData] = useState<FollowUpData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper to clean markdown and tags
  function cleanResponse(text: string) {
    // Remove HTML tags like <s>
    let cleaned = text.replace(/<\/?[^>]+(>|$)/g, '');

    // Remove markdown code fences ```json ... ```
    cleaned = cleaned.replace(/```json\s*([\s\S]*?)\s*```/g, '$1');

    // Remove other bracketed tags like [OUT]
    cleaned = cleaned.replace(/\[.*?\]/g, '');

    return cleaned.trim();
  }

  useEffect(() => {
    if (!emailText.trim()) {
      setFollowUpData(null);
      setError('');
      return;
    }

    const fetchFollowUp = async () => {
      setLoading(true);
      setError('');
      setFollowUpData(null);

      try {
        const res = await fetch('/api/followup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailText }),
        });

        const text = await res.text();

        if (!res.ok) {
          throw new Error(text || 'Failed to get follow-up data');
        }

        const cleanedText = cleanResponse(text);

        // Now safely parse JSON
        let data: FollowUpData;
        try {
          data = JSON.parse(cleanedText);
        } catch {
          throw new Error('Invalid JSON response after cleaning.');
        }

        setFollowUpData(data);
      } catch (err: any) {
        setError(err.message || 'Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchFollowUp();
  }, [emailText]);

  if (loading) return <div>Checking follow-up status...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!followUpData) return null;

  return (
    <div
      style={{
        marginTop: '1rem',
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: followUpData.needsFollowUp ? '#ffeb3b' : '#c8e6c9',
        border: '1px solid #ccc',
        fontSize: '16px',
      }}
    >
      {followUpData.needsFollowUp ? (
        <>
          <strong>⚠️ Follow-Up Needed</strong>
          <p>By: {followUpData.followUpBy || 'No specific deadline'}</p>
          <p>{followUpData.reason}</p>
        </>
      ) : (
        <>
          <strong>✅ No Follow-Up Needed</strong>
          <p>{followUpData.reason}</p>
        </>
      )}
    </div>
  );
}

export default FollowUpReminder;
