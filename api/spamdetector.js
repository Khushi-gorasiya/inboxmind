// api/spamdetector.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  const API_URL = 'https://api-inference.huggingface.co/models/bert-base-uncased';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VITE_HUGGINGFACE_TOKEN}`, 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: emailText }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: `Hugging Face API error: ${data.error}` });
    }

    const spamPrediction = data[0]?.label || 'Unknown';
    return res.status(200).json({ spamStatus: spamPrediction });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

