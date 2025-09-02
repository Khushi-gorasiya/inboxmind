// src/components/EventDetector.tsx

import React, { useEffect, useState } from "react";
import { postToAPI } from "../utils/api";

interface Props { emailText: string; }
interface EventDetails { title?: string; date?: string; time?: string; location?: string; }

function formatGoogleDateTime(date: string, time: string) {
  const dt = new Date(`${date} ${time}`);
  return isNaN(dt.getTime()) ? "" : dt.toISOString().replace(/[-:.\d{3}]/g, "");
}

function EventDetector({ emailText }: Props) {
  const [details, setDetails] = useState<EventDetails | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!emailText.trim()) return setDetails(null);

    (async () => {
      try {
        const data = await postToAPI("/api/eventDetector", { emailText });
        if (!data.isMeeting || !data.details?.date || !data.details.time) {
          setDetails(null);
          return;
        }
        setDetails(data.details);
        setError("");
      } catch (err: any) {
        setError(err.message);
      }
    })();
  }, [emailText]);

  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;
  if (!details) return null;

  const start = formatGoogleDateTime(details.date!, details.time!);
  if (!start) return null;

  const end = new Date(`${details.date} ${details.time}`);
  end.setHours(end.getHours() + 1);
  const endStr = end.toISOString().replace(/[-:.\d{3}]/g, "");

  const calendarUrl = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(
    details.title || "Meeting"
  )}&dates=${start}/${endStr}&details=${encodeURIComponent(
    emailText
  )}&location=${encodeURIComponent(details.location || "")}`;

  return (
    <div style={{ marginTop: "1rem" }}>
      <a
        href={calendarUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          backgroundColor: "#4285f4",
          color: "white",
          padding: "10px 16px",
          borderRadius: "6px",
          textDecoration: "none",
          fontWeight: "bold",
        }}
      >
        ➕ Add to Google Calendar
      </a>
    </div>
  );
}

export default EventDetector;
