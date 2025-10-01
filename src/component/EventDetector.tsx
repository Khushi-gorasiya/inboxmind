import { useEffect, useState } from 'react';
import chrono from 'chrono-node';

interface Props {
  emailText: string;
}

interface EventDetails {
  title?: string;
  date?: string;
  time?: string;
  location?: string;
}

function formatGoogleCalendarDateTime(date: Date) {
  // Format for Google Calendar: YYYYMMDDTHHmmssZ
  return date.toISOString().replace(/-|:|\.\d{3}/g, '');
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

        if (data.isMeeting && data.details) {
          // Use chrono to parse date and time
          const dateTimeString = `${data.details.date || ''} ${data.details.time || ''}`.trim();

          const parsedDate = chrono.parseDate(dateTimeString);

          if (!parsedDate || isNaN(parsedDate.getTime())) {
            setError('Could not parse event date/time.');
            setIsMeeting(false);
            setDetails(null);
            setLoading(false);
            return;
          }

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
  const location = details.location || '';
  const description = emailText;

  // Use chrono to parse the date/time string again for calendar links
  const dateTimeString = `${details.date || ''} ${details.time || ''}`.trim();
  const startDate = chrono.parseDate(dateTimeString);

  if (!startDate) {
    console.warn('Invalid event date/time:', dateTimeString);
    return null;
  }

  const start = formatGoogleCalendarDateTime(startDate);

  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour
  const end = formatGoogleCalendarDateTime(endDate);

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
