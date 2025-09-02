export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { emailText } = req.body;
  if (!emailText?.trim()) return res.status(400).json({ error: 'Missing emailText' });

  try {
    const API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-mnli';
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VITE_HUGGINGFACE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: emailText,
        parameters: {
          candidate_labels: ['Important', 'Not Important'],
          hypothesis_template: 'This email is critical to the user’s core work responsibilities: {}',
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `Hugging Face error: ${text}` });
    }

    const data = await response.json();
    const label = data?.labels?.[0];
    const score = data?.scores?.[0];

    const priority = label === 'Important' && score >= 0.7 ? 'Important'
                    : label === 'Not Important' ? 'Not Important'
                    : 'Uncertain';

    res.status(200).json({ priority, confidence: score });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
