import { useEffect, useState } from 'react';

interface Props {
  emailText: string;
}

function PriorityFlag({ emailText }: Props) {
  const [priority, setPriority] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!emailText.trim()) {
      setPriority('');
      setConfidence(null);
      return;
    }

    const getPriority = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/priority', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailText }),
        });

        const data = await response.json();
        setPriority(data.priority || 'Uncertain');
        setConfidence(data.confidence || null);
      } catch (err) {
        setPriority('Error');
        setConfidence(null);
      }
      setLoading(false);
    };

    getPriority();
  }, [emailText]);

  if (!priority || loading) return null;

  const getColor = () => {
    switch (priority) {
      case 'Important':
        return '#e53935'; // red
      case 'Not Important':
        return '#9e9e9e'; // gray
      case 'Uncertain':
        return '#fbc02d'; // yellow
      default:
        return '#ccc';
    }
  };

  return (
    <div
      style={{
        marginTop: '1rem',
        display: 'inline-block',
        backgroundColor: getColor(),
        color: 'white',
        padding: '5px 12px',
        borderRadius: '16px',
        fontWeight: 'bold',
      }}
    >
      {priority}
      {confidence !== null && typeof confidence === 'number'
        ? ` (${Math.round(confidence * 100)}%)`
        : ''}
    </div>
  );
}

export default PriorityFlag;
