// api/spamdetector.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;

  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  const API_URL = 'https://api-inference.huggingface.co/models/YOUR_MODEL'; // Replace with your Hugging Face model

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VITE_HUGGINGFACE_TOKEN}`, // Make sure to set this in your environment variables
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: emailText }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Error from Hugging Face API: ${errorText}` });
    }

    const data = await response.json();
    const isSpam = data?.label === 'spam' ? 'Spam' : 'Not Spam';
    const confidence = data?.confidence || 0;

    return res.status(200).json({ spam: isSpam, confidence });
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
