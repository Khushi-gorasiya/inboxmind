export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText?.trim()) {
    return res.status(400).json({ error: 'Missing emailText' });
  }

  const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  const API_KEY = process.env.GROQ_API_KEY;

  if (!API_KEY) {
    console.error('GROQ_API_KEY environment variable is missing!');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    console.log('Sending request to:', API_URL);
    console.log('API key loaded:', !!API_KEY);

    const payload = {
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant. Generate a short, polite reply to the email provided.',
        },
        {
          role: 'user',
          content: emailText,
        },
      ],
    };

    console.log('Payload:', JSON.stringify(payload));

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Response status:', response.status);

    const text = await response.text();
    console.log('Raw response:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: 'Invalid JSON response from API' });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'API request failed' });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    res.status(200).json({ reply: reply || 'No reply generated.' });
  } catch (err) {
    console.error('Error in handler:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
