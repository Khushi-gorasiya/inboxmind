import { useEffect, useState } from 'react';

interface Props {
  emailText: string;
}

interface EventDetails {
  title?: string;
  date?: string;
  time?: string;
  location?: string;
}

function formatGoogleCalendarDateTime(date: string, time: string) {
  try {
    if (!date || !time) return '';
    const dateTimeString = `${date} ${time}`;
    const parsedDate = new Date(dateTimeString);
    if (isNaN(parsedDate.getTime())) return '';
    return parsedDate.toISOString().replace(/[-:]/g, '').split('.')[0]; // Remove milliseconds
  } catch (e) {
    console.error('Date formatting error:', e);
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

        if (data.isMeeting && data.details && data.details.date && data.details.time) {
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

  if (loading) return <div>Detecting event...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!isMeeting || !details) return null;

  const title = details.title || 'Meeting';
  const date = details.date || '';
  const time = details.time || '';
  const location = details.location || '';
  const description = emailText;

  const start = formatGoogleCalendarDateTime(date, time);
  if (!start) return null;

  const endDate = new Date(`${date} ${time}`);
  if (isNaN(endDate.getTime())) return null;

  endDate.setHours(endDate.getHours() + 1);
  const end = endDate.toISOString().replace(/[-:]/g, '').split('.')[0];

  const calendarUrl = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(
    title
  )}&dates=${start}/${end}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(
    location
  )}`;

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
