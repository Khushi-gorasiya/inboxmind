export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { emailText } = req.body;
  if (!emailText) return res.status(400).json({ error: 'Missing emailText in request body' });

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are an assistant that responds in valid JSON.'
          },
          {
            role: 'user',
            content: `Classify this email as "Spam" or "Not Spam". Return ONLY a JSON object with keys "label" and "reason".\n\nEmail:\n${emailText}`
          }
        ]
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'OpenRouter error' });
    }

    if (!data.choices || data.choices.length === 0) {
      return res.status(500).json({ error: 'No choices returned from API' });
    }

    const content = data.choices[0].message?.content;

    if (!content || content.trim() === '') {
      return res.status(500).json({ error: 'Empty response from model' });
    }

    res.status(200).json({ rawResponse: content });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
