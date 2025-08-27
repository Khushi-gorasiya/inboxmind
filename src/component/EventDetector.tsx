import { useEffect, useState } from 'react';

interface Props {
  emailText: string;
}

interface EventDetails {
  title?: string;
  date?: string; // YYYY-MM-DD format
  time?: string; // HH:mm:ss format
  location?: string;
}

function formatGoogleCalendarDateTime(date: string, time: string) {
  try {
    const dateTimeString = `${date}T${time}`;
    const parsedDate = new Date(dateTimeString);

    if (isNaN(parsedDate.getTime())) return '';

    return parsedDate.toISOString().replace(/-|:|\.\d{3}/g, '');
  } catch {
    return '';
  }
}

function EventDetector({ emailText }: Props) {
  const [loading, setLoading] = useState(false);
  const [isMeeting, setIsMeeting] = useState(false);
  const [details, setDetails] = useState<EventDetails | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!emailText.trim()) {
      setIsMeeting(false);
      setDetails(null);
      setError('');
      return;
    }

    const detectEvent = async () => {
      setLoading(true);
      setError('');
      setIsMeeting(false);
      setDetails(null);

      try {
        const res = await fetch('/api/eventDetector', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailText }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to detect event.');
        }

        const data = await res.json();

        if (data.isMeeting) {
          setIsMeeting(true);
          setDetails(data.details);
        } else {
          setIsMeeting(false);
          setDetails(null);
        }
      } catch (err: any) {
        console.error('Event detection error:', err);
        setError(err.message || 'Network error');
        setIsMeeting(false);
        setDetails(null);
      } finally {
        setLoading(false);
      }
    };

    detectEvent();
  }, [emailText]);

  if (loading) return <p>Detecting events...</p>;

  if (error) {
    return (
      <div style={{ marginTop: '1rem', color: 'red' }}>
        ⚠️ Event detection error: {error}
      </div>
    );
  }

  if (!isMeeting || !details) return null;

  const { title = 'Meeting', date = '', time = '', location = '' } = details;
  const description = emailText;

  const start = formatGoogleCalendarDateTime(date, time);
  const endDate = new Date(`${date}T${time}`);
  endDate.setHours(endDate.getHours() + 1);
  const end = endDate.toISOString().replace(/-|:|\.\d{3}/g, '');

  if (!start || !end) {
    return (
      <div style={{ marginTop: '1rem', color: 'orange' }}>
        ⚠️ Invalid event date/time detected.
      </div>
    );
  }

  const calendarUrl = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(
    title
  )}&dates=${start}/${end}&details=${encodeURIComponent(
    description
  )}&location=${encodeURIComponent(location)}`;

  return (
    <div style={{ marginTop: '1rem' }}>
      <a
        href={calendarUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          backgroundColor: '#4285f4',
          color: 'white',
          padding: '10px 16px',
          borderRadius: '6px',
          textDecoration: 'none',
          fontWeight: 'bold',
        }}
      >
        ➕ Add to Google Calendar
      </a>
    </div>
  );
}

export default EventDetector;
