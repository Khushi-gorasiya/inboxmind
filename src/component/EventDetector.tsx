import { useEffect, useState } from 'react';
import * as chrono from 'chrono-node';

interface Props {
  emailText: string;
}

interface EventDetails {
  title?: string;
  date?: string;
  time?: string;
  location?: string;
}

// Helper to format for Google Calendar link
function formatGoogleCalendarDateTime(date: Date) {
  return date.toISOString().replace(/-|:|\.\d{3}/g, '');
}

function EventDetector({ emailText }: Props) {
  const [loading, setLoading] = useState(false);
  const [isMeeting, setIsMeeting] = useState(false);
  const [details, setDetails] = useState<EventDetails | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // If email is empty, reset everything
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
        console.log('[EventDetector] Sending request for email:', emailText);

        const res = await fetch('/api/eventDetector', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailText }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || 'Failed to detect event');
        }

        const data = await res.json();
        console.log('[EventDetector] Received data:', data);

        if (data.isMeeting && data.details) {
          const dtString = `${data.details.date || ''} ${data.details.time || ''}`.trim();
          console.log('[EventDetector] dtString to parse:', dtString);

          const parsed = chrono.parseDate(dtString);
          console.log('[EventDetector] Parsed date:', parsed);

          if (parsed && !isNaN(parsed.getTime())) {
            setIsMeeting(true);
            setDetails(data.details);
          } else {
            console.warn('[EventDetector] Could not parse date/time for event.');
            setIsMeeting(false);
            setDetails(null);
          }
        } else {
          setIsMeeting(false);
          setDetails(null);
        }
      } catch (err: any) {
        console.error('[EventDetector] Error:', err);
        setError(err.message || 'Network error');
        setIsMeeting(false);
        setDetails(null);
      } finally {
        setLoading(false);
      }
    };

    detectEvent();
  }, [emailText]); // re-run whenever emailText changes

  if (loading) return <div>Detecting event...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!isMeeting || !details) return null;

  const title = details.title || 'Meeting';
  const location = details.location || '';
  const description = emailText;

  const dtString = `${details.date || ''} ${details.time || ''}`.trim();
  const startDate = chrono.parseDate(dtString);
  if (!startDate) {
    console.warn('[EventDetector] startDate invalid:', dtString);
    return null;
  }


  const start = formatGoogleCalendarDateTime(startDate);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
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

    {/* ⚠️ Warning if date or time is missing */}
    {(!details.date || !details.time) && (
      <p
        style={{
          marginTop: '8px',
          color: '#856404',
          backgroundColor: '#fff3cd',
          padding: '10px',
          borderRadius: '6px',
          border: '1px solid #ffeeba',
          fontSize: '14px',
        }}
      >
        ⚠️ Date or time wasn’t clearly specified in the email. Please double-check the event timing after adding it to your calendar.
      </p>
    )}
  </div>
);

}

export default EventDetector;
