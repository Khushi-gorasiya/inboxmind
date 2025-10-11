export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText?.trim()) {
    return res.status(400).json({ error: 'Missing emailText' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    });

    // Check if the response is OK before trying to parse it
    const contentType = response.headers.get('content-type');
    if (!response.ok) {
      // Try to get the text response (could be HTML or plain error)
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `Groq API Error: ${errorText}`,
      });
    }

    // Ensure it's JSON before parsing
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(500).json({ error: 'Invalid response format from Groq API' });
    }

    const data = await response.json();

    const reply = data?.choices?.[0]?.message?.content?.trim();
    res.status(200).json({ reply: reply || 'No reply generated.' });

  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
