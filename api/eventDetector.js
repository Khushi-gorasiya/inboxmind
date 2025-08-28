export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { emailText } = req.body;
  if (!emailText) return res.status(400).json({ error: 'Missing emailText' });

  const API_URL = 'https://api-inference.huggingface.co/models/google/flan-t5-base';
  const prompt = `
Extract event details in this exact format:

Title: <event title>
Date: <date string>
Time: <time string>
Location: <location>

If no event present, reply: No event found.

Email:
${emailText}
`;

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
  if (raw.toLowerCase().includes('no event found')) {
    return res.status(200).json({ isMeeting: false });
  }

  const details: any = {};
  raw.split('\n').forEach(line => {
    const [key, ...vals] = line.split(':');
    if (key && vals.length) {
      details[key.trim().toLowerCase()] = vals.join(':').trim();
    }
  });

  const isMeeting = details.date || details.time;
  return res.status(200).json({ isMeeting, details });
}
