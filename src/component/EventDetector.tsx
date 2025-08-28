import { useEffect, useState } from 'react';

interface Details {
  title: string;
  date: string;
  time: string;
  location: string;
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
      if (data.isMeeting) setDetails(data.details);
      else setDetails(null);
    })();
  }, [emailText]);

  if (!details) return null;

  const { title, date, time, location } = details;
  // Create a dateParam from date & time; best effort
  const dateParam = encodeURIComponent(`${date.replace(/\s/g, '')}T${time.replace(/[:\sAPMapm]/g, '')}`);

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dateParam}/${dateParam}&location=${encodeURIComponent(location)}&details=${encodeURIComponent(emailText)}`;

  return (
    <div style={{ marginTop: '1rem' }}>
      <a href={url} target="_blank" rel="noopener noreferrer"
         style={{ padding: '10px 16px', backgroundColor: '#4285f4', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }} >
        ➕ Add to Google Calendar
      </a>
    </div>
  );
}
