// api/spamdetector.js

const fetch = require('node-fetch'); // if you're using Node.js, otherwise you can use fetch in modern browsers

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;

  if (!emailText) {
    return res.status(400).json({ error: 'Missing email text' });
  }

  // Call Hugging Face API for spam detection
  const API_URL = 'https://api-inference.huggingface.co/models/google/bert-large-discussion';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer YOUR_HUGGINGFACE_API_KEY`, // Replace with your Hugging Face API key
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: emailText,
      }),
    });

    const data = await response.json();

    // You can adjust logic based on the response from Hugging Face
    const label = data?.labels?.[0];  // Example: 'Spam' or 'Not Spam'
    const score = data?.scores?.[0];  // Spam detection confidence score

    if (label === 'Spam' && score >= 0.7) {
      return res.status(200).json({ spam: 'Spam', confidence: score });
    } else {
      return res.status(200).json({ spam: 'Not Spam', confidence: score });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
