export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  const API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';

  const prompt = `
  Classify the following email as "Important" or "Not Important".
  Respond ONLY with "Important" or "Not Important".

  Email:
  ${emailText}
  `;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VITE_HUGGINGFACE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `Hugging Face API error: ${text}` });
    }

    const data = await response.json();
    const resultText = data[0]?.summary_text?.trim();

    if (resultText === 'Important' || resultText === 'Not Important') {
      return res.status(200).json({ priority: resultText });
    } else {
      return res.status(200).json({ priority: 'Uncertain' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
