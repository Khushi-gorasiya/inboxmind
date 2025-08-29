// src/component/EventDetector.tsx

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

  if (!details || !details.date) return null;

  // Extract time safely: fallback to 09:00 if not found
  const extractedTime = details.time?.match(/\d{1,2}:\d{2}/)?.[0] || '09:00';
  const cleanedTime = extractedTime.replace(':', '') + '00';

  // Format date string to YYYYMMDD
  const parsedDate = new Date(details.date);
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const dateTime = `${dateStr}T${cleanedTime}`;

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(details.title || 'Meeting')}&dates=${dateTime}/${dateTime}&location=${encodeURIComponent(details.location || '')}&details=${encodeURIComponent(emailText)}`;

  return (
    <div style={{ marginTop: '1rem' }}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: '10px 16px',
          backgroundColor: '#4285f4',
          color: '#fff',
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
