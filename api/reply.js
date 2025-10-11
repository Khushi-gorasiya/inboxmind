export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText?.trim()) {
    return res.status(400).json({ error: 'Missing emailText' });
  }

  try {
    console.log('API Key loaded:', !!process.env.GROQ_API_KEY);
    console.log('Sending request to Groq API at https://api.groq.com/openai/v1/chat/completions');
    console.log('Request payload:', JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an AI assistant. Generate a short, polite reply to the email provided.' },
        { role: 'user', content: emailText },
      ],
    }));

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are an AI assistant. Generate a short, polite reply to the email provided.' },
          { role: 'user', content: emailText },
        ],
      }),
    });

    console.log('Response status from Groq:', response.status);

    const text = await response.text();

    // Log raw response text (useful for debugging JSON parse errors)
    console.log('Raw response text:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (jsonErr) {
      console.error('Failed to parse JSON:', jsonErr);
      return res.status(500).json({ error: 'Invalid JSON response from Groq API' });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: (typeof data.error === 'string' ? data.error : JSON.stringify(data.error)) || 'Reply generation failed',
      });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    res.status(200).json({ reply: reply || 'No reply generated.' });
  } catch (err) {
    console.error('Error in handler:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
