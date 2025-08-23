export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText' });
  }

  const token = process.env.VITE_HUGGINGFACE_TOKEN;
  const API_URL = 'https://api-inference.huggingface.co/models/google/flan-t5-base';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `Generate a short, polite reply to this email:\n\n${emailText}`,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: result.error || 'Unknown Hugging Face API error' });
    }

    if (result.error) {
      return res.status(500).json({ error: `Hugging Face error: ${result.error}` });
    }

    const reply =
      Array.isArray(result) && result[0]?.generated_text
        ? result[0].generated_text
        : result.generated_text || '';

    if (!reply || reply.trim() === '') {
      return res.status(500).json({ error: 'No reply generated.' });
    }

    return res.status(200).json({ reply: reply.trim() });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
