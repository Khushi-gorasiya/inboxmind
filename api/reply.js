export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;

  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  const API_URL = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VITE_HUGGINGFACE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `User: ${emailText}\nAI:`,
        parameters: {
          max_new_tokens: 80,
          do_sample: true,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `Hugging Face API error: ${text}` });
    }

    const data = await response.json();

    const reply = typeof data === 'object' && data.generated_text
      ? data.generated_text.replace(/^.*AI:\s*/, '').trim()
      : 'No reply generated';

    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
