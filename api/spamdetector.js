export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { emailText } = req.body;
  if (!emailText) return res.status(400).json({ error: 'Missing emailText in request body' });

  const hfToken = process.env.VITE_HUGGINGFACE_TOKEN;
  if (!hfToken) return res.status(500).json({ error: 'Hugging Face API key not configured' });

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english',
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

    const result = data[0];

    // Interpret POSITIVE as Not Spam, NEGATIVE as Spam
    const label = result.label === 'NEGATIVE' ? 'Spam' : 'Not Spam';
    const score = typeof result.score === 'number' ? result.score : 0;
    const reason = `Model confidence: ${(score * 100).toFixed(2)}%`;

    res.status(200).json({ spamStatus: label, reason });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
