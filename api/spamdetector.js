export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { emailText } = req.body;
  if (!emailText) return res.status(400).json({ error: 'Missing emailText' });

  const API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-mnli';

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
          candidate_labels: ['spam', 'not spam'],
          hypothesis_template: 'This text is {}.',
        },
      }),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: 'Invalid JSON response: ' + text });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'Error from Hugging Face API' });
    }

    const label = data.labels?.[0] || 'Unknown';
    const score = data.scores?.[0] || 0;
    return res.status(200).json({ spamStatus: label, confidence: score });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
