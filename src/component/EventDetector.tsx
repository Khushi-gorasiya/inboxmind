import { useEffect, useState } from 'react';
import chrono from 'chrono-node';

interface Props {
  emailText: string;
}

function formatDateToGoogleCal(dateObj: Date) {
  return dateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function EventDetector({ emailText }: Props) {
  const [eventInfo, setEventInfo] = useState<{
    title: string;
    start: string;
    end: string;
    location: string;
  } | null>(null);

  useEffect(() => {
    if (!emailText.trim()) {
      setEventInfo(null);
      return;
    }

    const parsed = chrono.parse(emailText);

    if (parsed.length > 0) {
      const first = parsed[0];
      const startDate = first.start.date();

      // Add 1 hour by default for event duration
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      const start = formatDateToGoogleCal(startDate);
      const end = formatDateToGoogleCal(endDate);

      // Try to find location from common patterns
      const locationMatch = emailText.match(/location[:\-]?\s*(.*)/i);
      const location = locationMatch?.[1]?.split('\n')[0] || '';

      // Title guess (fallback if none): "Meeting"
      const titleMatch = emailText.match(/subject[:\-]?\s*(.*)/i) ||
                         emailText.match(/meeting[:\-]?\s*(.*)/i);
      const title = titleMatch?.[1]?.split('\n')[0] || 'Meeting';

      setEventInfo({
        title,
        start,
        end,
        location,
      });
    } else {
      setEventInfo(null);
    }
  }, [emailText]);

  if (!eventInfo) return null;

  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    eventInfo.title
  )}&dates=${eventInfo.start}/${eventInfo.end}&location=${encodeURIComponent(
    eventInfo.location
  )}&details=${encodeURIComponent(emailText)}`;

  return (
    <div style={{ marginTop: '1rem' }}>
      <a
        href={calendarUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          backgroundColor: '#34a853',
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
