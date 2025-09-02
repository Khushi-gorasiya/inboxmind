export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { emailText } = req.body;
  if (!emailText?.trim()) return res.status(400).json({ error: 'Missing emailText' });

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://inboxmind-one.vercel.app/',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant. Generate a short, polite reply to the email provided.',
          },
          {
            role: 'user',
            content: emailText,
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Reply generation failed');

    const reply = data?.choices?.[0]?.message?.content?.trim();
    res.status(200).json({ reply: reply || 'No reply generated.' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
