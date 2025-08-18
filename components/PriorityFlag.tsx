import { useState } from 'react';

interface Props {
  emailText: string;
}

export default function PriorityFlag({ emailText }: Props) {
  const [priority, setPriority] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkPriority = async () => {
    if (!emailText.trim()) return;

    setLoading(true);
    setPriority(null);

    try {
      const response = await fetch('/api/priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailText }),
      });

      const data = await response.json();
      if (data.priority) {
        setPriority(data.priority);
      } else {
        setPriority('Error');
      }
    } catch (err) {
      setPriority('Error');
    }

    setLoading(false);
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <button onClick={checkPriority} disabled={loading || !emailText.trim()} style={{ padding: '8px 16px' }}>
        {loading ? 'Checking Priority...' : 'Check Priority'}
      </button>

      {priority && (
        <div style={{ marginTop: '1rem', fontSize: '18px' }}>
          Priority: <strong style={{ color: priority === 'Important' ? 'red' : 'gray' }}>{priority}</strong>
        </div>
      )}
    </div>
  );
}
