import chrono from 'chrono-node';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  try {
    // Use chrono-node to parse date/time
    const results = chrono.parse(emailText);

    if (!results.length) {
      return res.status(200).json({ isMeeting: false });
    }

    const parsed = results[0];
    const startDate = parsed.start?.date();

    // Optional: check for a range (like 10am–11am)
    let endDate = null;
    if (parsed.end) {
      endDate = parsed.end.date();
    } else if (startDate) {
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1-hour meeting
    }

    // Try extracting a location
    const locationMatch = emailText.match(/(Location|📍)[:\-]?\s*(.*)/i);
    const location = locationMatch ? locationMatch[2].trim() : '';

    // Try extracting a title from context
    const titleMatch = emailText.match(/(?:subject|about|meeting|event)[:\-]?\s*(.*)/i);
    const title =
      titleMatch?.[1]?.trim() ||
      'Meeting'; // Default title if not found

    const details = {
      title,
      date: startDate.toDateString(),
      time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location,
      startISO: startDate.toISOString(),
      endISO: endDate.toISOString(),
    };

    return res.status(200).json({ isMeeting: true, details });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
