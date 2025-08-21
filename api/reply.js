export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText' });
  }

  try {
    const response = await fetch('https://api-inference.huggingface.co/models/google/flan-t5-large', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VITE_HUGGINGFACE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `Generate a short, polite reply to this email:\n\n${emailText}`,
      }),
    });

    const data = await response.json();
    const reply = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
    if (!reply) {
      return res.status(500).json({ error: 'No reply generated' });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
