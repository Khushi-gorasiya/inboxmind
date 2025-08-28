export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  const API_URL = 'https://api-inference.huggingface.co/models/google/flan-t5-large';

  try {
    const prompt = `Extract meeting or event details (title, date, time, and location) from the following email. If none, respond with "No event found". Email:\n\n${emailText}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VITE_HUGGINGFACE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
      }),
    });

    const data = await response.json();

    const raw = data?.[0]?.generated_text || '';
    if (!raw || raw.toLowerCase().includes('no event')) {
      return res.status(200).json({ isMeeting: false });
    }

    // Try extracting fields using basic regex
    const titleMatch = raw.match(/title[:\-]?\s*(.*)/i);
    const dateMatch = raw.match(/date[:\-]?\s*(.*)/i);
    const timeMatch = raw.match(/time[:\-]?\s*(.*)/i);
    const locationMatch = raw.match(/location[:\-]?\s*(.*)/i);

    const details = {
      title: titleMatch ? titleMatch[1].trim() : '',
      date: dateMatch ? dateMatch[1].trim() : '',
      time: timeMatch ? timeMatch[1].trim() : '',
      location: locationMatch ? locationMatch[1].trim() : '',
    };

    return res.status(200).json({ isMeeting: true, details });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
