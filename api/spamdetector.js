export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

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
            content: 'You are an AI assistant that classifies emails as spam or not spam.'
          },
          {
            role: 'user',
            content: `Classify the following email as "Spam" or "Not Spam", and return JSON only with "label" and "reason" keys.\n\nEmail:\n${emailText}`
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'spam_detection',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                label: { type: 'string', enum: ['Spam', 'Not Spam'] },
                reason: { type: 'string' },
              },
              required: ['label', 'reason'],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: json.error || 'Error from OpenRouter' });
    }

    const { label, reason } = json.choices?.[0]?.message?.content || {};
    if (!label || !reason) {
      return res.status(500).json({ error: 'Invalid structured output' });
    }

    return res.status(200).json({ spamStatus: label, reason });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
