export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  const API_URL = 'https://api-inference.huggingface.co/models/roberta-large-mnli';
  const API_TOKEN = process.env.HUGGINGFACE_API_KEY;  // Make sure to set this in your .env

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: emailText,
        parameters: {
          candidate_labels: ['spam', 'not spam'],
          hypothesis_template: 'This email is {}.',
        },
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ error: `Hugging Face API error: ${data.error}` });
    }

    const label = data?.labels?.[0];
    const isSpam = label === 'spam';

    return res.status(200).json({ isSpam });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
