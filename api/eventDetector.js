export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { emailText } = req.body;
  if (!emailText) return res.status(400).json({ error: 'Missing emailText' });

  const API_URL = 'https://api-inference.huggingface.co/models/google/flan-t5-small';
  const prompt = `
You are an assistant that extracts event details from emails.
Return ONLY valid JSON with keys:
{"title": "...", "date": "...", "time": "...", "location": "..."}

If there's no event, respond with:
{"title": "", "date": "", "time": "", "location": ""}

Email:
${emailText}
`;

  try {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VITE_HUGGINGFACE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return res.status(resp.status).json({ error: `HF API error: ${err}` });
    }

    const data = await resp.json();
    const raw = data?.[0]?.generated_text || '';
    let details;
    try {
      details = JSON.parse(raw);
    } catch {
      return res.status(200).json({ isMeeting: false, details: { title: '', date: '', time: '', location: '' } });
    }

    const isMeeting = Boolean(details.title || details.date || details.time || details.location);
    return res.status(200).json({ isMeeting, details });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
