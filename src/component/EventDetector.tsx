import { useEffect, useState } from 'react';

interface Details {
  title?: string;
  date?: string;
  time?: string;
  location?: string;
}

export default function EventDetector({ emailText }: { emailText: string }) {
  const [details, setDetails] = useState<Details | null>(null);

  useEffect(() => {
    if (!emailText.trim()) return setDetails(null);

    (async () => {
      const res = await fetch('/api/eventDetector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailText }),
      });
      const data = await res.json();
      setDetails(data.isMeeting ? data.details : null);
    })();
  }, [emailText]);

  if (!details || !details.date || !details.time) return null;

  // Simplify date/time formatting (best effort):
  const dateStr = details.date.replace(/, /g, '').replace(/ /g, '');
  const timeStr = details.time.replace(/[^0-9]/g, '').padStart(4, '0');
  const dateTime = `${dateStr}T${timeStr}`;

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(details.title || 'Meeting')}&dates=${dateTime}/${dateTime}&location=${encodeURIComponent(details.location || '')}&details=${encodeURIComponent(emailText)}`;

  return (
    <div style={{ marginTop: '1rem' }}>
      <a href={url} target="_blank" rel="noopener noreferrer"
         style={{ padding: '10px 16px', backgroundColor: '#4285f4', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>
        ➕ Add to Google Calendar
      </a>
    </div>
  );
}
