export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { emailText } = req.body;
  if (!emailText?.trim()) return res.status(400).json({ error: 'Missing emailText' });

  try {
    const resp = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-mnli', {
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
    if (!resp.ok) throw new Error(await resp.text());
    const { labels, scores } = await resp.json();
    const label = labels?.[0];
    const score = scores?.[0];
    const priority = label === 'Important' && score >= 0.7
      ? 'Important'
      : label === 'Not Important'
      ? 'Not Important'
      : 'Uncertain';
    res.status(200).json({ priority, confidence: score });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
