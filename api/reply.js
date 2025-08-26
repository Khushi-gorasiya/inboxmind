export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;

  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  const API_URL = 'https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VITE_HUGGINGFACE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `Generate a short, polite reply to this email:\n${emailText}`,
        parameters: {
          max_new_tokens: 100,
          do_sample: false,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `Hugging Face API error: ${text}` });
    }

    const data = await response.json();

    const reply = data.generated_text || 'No reply generated';

    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
