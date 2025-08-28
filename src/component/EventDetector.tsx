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
  // Format date object to 'YYYYMMDDTHHmmssZ'
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
        // Call your existing backend API to extract event details
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

  // Combine date and time fields if possible
  const dateTimeText = [details.date, details.time].filter(Boolean).join(' ');

  // Use chrono-node to parse natural language date/time
  const parsedDates = chrono.parse(dateTimeText);

  if (parsedDates.length === 0) {
    console.warn('Failed to parse date/time:', dateTimeText);
    return null;
  }

  const startDate = parsedDates[0].start.date();

  // Determine end date/time: if end is detected in parsing, else +1 hour
  let endDate = startDate;
  if (parsedDates[0].end) {
    endDate = parsedDates[0].end.date();
  } else {
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour
  }

  const start = formatGoogleCalendarDateTime(startDate);
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
