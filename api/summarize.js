export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  const API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';

  // Limit input length to ~2000 characters to prevent "index out of range" error
  const safeText = emailText.slice(0, 2000);

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
          max_length: 200,   // You can adjust this value
          min_length: 50,
          do_sample: false,
          truncation: true, // important to avoid model errors
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Hugging Face API error: ${errorText}` });
    }

    const data = await response.json();

    const summary =
      Array.isArray(data) && data[0]?.summary_text
        ? data[0].summary_text
        : data?.summary_text || 'No summary returned.';

    return res.status(200).json({ summary });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
