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
    if (!date) return '';

    // Combine date and time if time exists, else use date only
    const dateTimeString = time ? `${date} ${time}` : date;
    const parsedDate = new Date(dateTimeString);

    if (isNaN(parsedDate.getTime())) return '';

    // Format like 20250830T100000Z (ISO without punctuation)
    return parsedDate.toISOString().replace(/-|:|\.\d{3}/g, '');
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
  const date = details.date || '';
  const time = details.time || '';
  const location = details.location || '';
  const description = emailText;

  const start = formatGoogleCalendarDateTime(date, time);

  if (!start) {
    console.warn('Invalid start date/time:', date, time);
    return null;
  }

  // Calculate end time: if time is a range like "10:00 AM – 11:00 AM", try to use the end time,
  // else default to 1 hour after start
  let end = '';
  try {
    const dateObj = new Date(`${date} ${time.split(/[–-]/)[0].trim()}`);
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid start date/time:', date, time);
      return null;
    }

    let endDateObj = new Date(dateObj);

    // If time is a range, parse the second time as end
    if (time.includes('–') || time.includes('-')) {
      const timeParts = time.split(/[–-]/);
      const endTimeStr = timeParts[1].trim();
      const parsedEndDate = new Date(`${date} ${endTimeStr}`);
      if (!isNaN(parsedEndDate.getTime())) {
        endDateObj = parsedEndDate;
      } else {
        // fallback +1 hour if end time parsing fails
        endDateObj.setHours(endDateObj.getHours() + 1);
      }
    } else {
      // No range, add 1 hour
      endDateObj.setHours(endDateObj.getHours() + 1);
    }

    end = endDateObj.toISOString().replace(/-|:|\.\d{3}/g, '');
  } catch (e) {
    console.warn('Error parsing end date/time:', e);
    // fallback 1 hour after start
    const fallbackEndDate = new Date(new Date().getTime() + 60 * 60 * 1000);
    end = fallbackEndDate.toISOString().replace(/-|:|\.\d{3}/g, '');
  }

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
