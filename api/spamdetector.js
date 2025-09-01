export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  const API_URL = 'https://api-inference.huggingface.co/models/mrm8488/bert-tiny-finetuned-sms-spam-detection';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VITE_HUGGINGFACE_TOKEN}`, // Ensure this env var is set
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: emailText }),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: 'Invalid JSON from Hugging Face: ' + text });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'Hugging Face API error' });
    }

    // Expecting an array with a label field, e.g., [{ label: "ham", score: 0.99 }]
    const label = Array.isArray(data) && data[0]?.label ? data[0].label : 'Unknown';

    return res.status(200).json({ spamStatus: label });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
