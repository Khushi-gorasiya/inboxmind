export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText?.trim()) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  const safeText = emailText.slice(0, 2000); // prevent model overload
  const API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VITE_HUGGINGFACE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: safeText,
        parameters: {
          max_length: 200,
          min_length: 50,
          do_sample: false,
          truncation: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Hugging Face error: ${errorText}` });
    }

    const data = await response.json();
    const summary = Array.isArray(data) ? data[0]?.summary_text : data?.summary_text;

    res.status(200).json({ summary: summary || 'No summary returned.' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
