export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  const API_URL = 'https://api-inference.huggingface.co/models/your-spam-model'; // e.g., "mrm8488/bert-tiny-finetuned-sms-spam-detection"

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_API_TOKEN}`, // Your API key from Vercel env variables
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: emailText }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'HF API error' });
    }

    // Assuming response: [{label: "spam"/"ham", score: 0.xx}]
    const prediction = data[0]?.label || 'Unknown';

    res.status(200).json({ spamStatus: prediction });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
