// pages/api/smartReply.ts (or .js if using JavaScript)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText || !emailText.trim()) {
    return res.status(400).json({ error: 'Missing or empty emailText' });
  }

  const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  const API_KEY = process.env.GROQ_API_KEY;

  if (!API_KEY) {
    console.error('❌ GROQ_API_KEY is missing!');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Build request body as per Groq's docs
    const requestBody = {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an AI assistant. Generate a short, polite reply to the email provided.' },
        { role: 'user', content: emailText },
      ],
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Debug logs (remove in production)
    console.log('API Response status:', response.status);

    const responseText = await response.text();

    console.log('Raw API response:', responseText);

    // Parse JSON safely
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(500).json({ error: 'Failed to parse JSON response from Groq API' });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'API request failed' });
    }

    const reply = data?.choices?.[0]?.message?.content || 'No reply generated.';
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('❌ Handler error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
