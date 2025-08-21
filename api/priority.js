export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

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
           candidate_labels: ['Important', 'Not Important'],
           hypothesis_template: 'This email is {} for the user’s professional productivity.',
         },
       }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `Hugging Face API error: ${text}` });
    }

    const data = await response.json();
    const label = data?.labels?.[0];
    const score = data?.scores?.[0];

    if (label === 'Important' && score >= 0.7) {
      return res.status(200).json({ priority: 'Important', confidence: score });
    } else if (label === 'Not Important') {
      return res.status(200).json({ priority: 'Not Important', confidence: score });
    } else {
      return res.status(200).json({ priority: 'Uncertain', confidence: score });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
