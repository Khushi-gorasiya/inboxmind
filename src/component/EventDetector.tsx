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

function formatGoogleCalendarDateTime(date: string, time: string): string {
  try {
    if (!date || !time) return '';
    const dateTimeString = `${date} ${time}`;
    const parsedDate = new Date(dateTimeString);
    if (isNaN(parsedDate.getTime())) return '';
    return parsedDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  } catch {
    return '';
  }
}

function EventDetector({ emailText }: Props) {
  const [loading, setLoading] = useState(false);
  const [isMeeting, setIsMeeting] = useState(false);
  const [details, setDetails] = useState<EventDetails | null>(null);

  useEffect(() => {
    if (!emailText.trim()) {
      setIsMeeting(false);
      setDetails(null);
      return;
    }

    const detectEvent = async () => {
      setLoading(true);
      setIsMeeting(false);
      setDetails(null);

      try {
        const res = await fetch('/api/eventDetector', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailText }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to detect event.');

        if (data.isMeeting && data.details) {
          setIsMeeting(true);
          setDetails(data.details);
        }
      } catch (err) {
        console.error('EventDetector error:', err); // ← log to console but avoid crashing
      } finally {
        setLoading(false);
      }
    };

    detectEvent();
  }, [emailText]);

  if (!isMeeting || loading || !details) return null;

  const { title = 'Meeting', date = '', time = '', location = '' } = details;
  const description = emailText;

  const start = formatGoogleCalendarDateTime(date, time);

  let end = '';
  if (start) {
    try {
      const endDate = new Date(`${date} ${time}`);
      endDate.setHours(endDate.getHours() + 1);
      end = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    } catch {
      end = '';
    }
  }

  // 💡 Don't render anything if dates are invalid
  if (!start || !end) return null;

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
