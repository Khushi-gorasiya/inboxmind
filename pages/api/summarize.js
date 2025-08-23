export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  const API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VITE_HUGGINGFACE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: emailText,
        parameters: {
          max_length: 130,
          min_length: 30,
          do_sample: false,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `Hugging Face API error: ${text}` });
    }

    const data = await response.json();

    if (Array.isArray(data) && data[0]?.summary_text) {
      return res.status(200).json({ summary: data[0].summary_text });
    } else {
      return res.status(500).json({ error: 'Unexpected response format from Hugging Face API' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
