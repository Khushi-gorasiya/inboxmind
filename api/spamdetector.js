export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { emailText } = req.body;
  if (!emailText) return res.status(400).json({ error: 'Missing emailText in request body' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Groq API key not configured' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are an assistant that responds ONLY with a JSON object: { "label": "Spam" or "Not Spam", "reason": "..." }. No extra explanation or markdown.',
          },
          {
            role: 'user',
            content: `Classify this email as Spam or Not Spam. Email:\n${emailText}`,
          },
        ],
        // Note: Groq may not support OpenAI's `response_format` field yet. We'll handle that manually.
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'Groq API error' });
    }

    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return res.status(500).json({ error: 'Empty response from model' });
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // Try to clean up extra text if model added it
      try {
        const cleaned = content
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        parsed = JSON.parse(cleaned);
      } catch {
        return res.status(500).json({ error: 'Invalid JSON from model', raw: content });
      }
    }

    const { label, reason } = parsed;
    if (!label || !reason) {
      return res.status(500).json({ error: 'Parsed JSON missing label or reason', parsed });
    }

    return res.status(200).json({ spamStatus: label, reason });
  } catch (err) {
    console.error('Spam detector error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
