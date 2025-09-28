export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { emailText } = req.body;
  if (!emailText) return res.status(400).json({ error: 'Missing emailText in request body' });

  const hfToken = process.env.VITE_HUGGINGFACE_TOKEN;
  if (!hfToken) return res.status(500).json({ error: 'Hugging Face API key not configured' });

  try {
    // Use the spam detection model
    const response = await fetch(
      'https://api-inference.huggingface.co/models/mrm8488/bert-tiny-finetuned-sms-spam-detection',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: emailText,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      return res.status(response.status).json({ error: errorData || 'Hugging Face API error' });
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(500).json({ error: 'Empty response from model' });
    }

    // The model returns something like: [{label: "HAM", score: 0.98}] or [{label: "SPAM", score: 0.99}]
    const result = data[0];
    const label = result.label === 'SPAM' ? 'Spam' : 'Not Spam';
    const reason = `Model confidence: ${(result.score * 100).toFixed(2)}%`;

    res.status(200).json({ spamStatus: label, reason });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
