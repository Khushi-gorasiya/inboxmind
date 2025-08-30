export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  const API_URL = 'https://api-inference.huggingface.co/models/abhinavm/spam-detector';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`, // Replace with your Hugging Face token
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: emailText }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Hugging Face API error: ${errorText}` });
    }

    const data = await response.json();
    const label = data?.label; // Assuming the model returns a label like 'spam' or 'ham'

    if (label) {
      return res.status(200).json({ isSpam: label === 'spam' });
    } else {
      return res.status(200).json({ isSpam: false });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
