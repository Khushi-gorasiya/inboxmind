// api/toneAnalyzer.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText?.trim()) {
    return res.status(400).json({ error: 'Missing emailText' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are an assistant that analyzes the tone of an email and responds in JSON format with keys "tone" and "explanation". The tone should be one of: Formal, Informal, Friendly, Neutral, Urgent, or Other.',
          },
          {
            role: 'user',
            content: `Analyze the tone of the following email:\n\n${emailText}`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Tone analysis failed');
    }

    // The model response should be JSON string. Try parse it:
    let parsed;
    try {
      parsed = JSON.parse(data.choices[0].message.content);
    } catch {
      // fallback: return raw content if parsing fails
      return res.status(200).json({
        tone: 'Unknown',
        explanation: data.choices[0].message.content.trim(),
      });
    }

    const { tone, explanation } = parsed;

    if (!tone || !explanation) {
      return res.status(200).json({
        tone: 'Unknown',
        explanation: data.choices[0].message.content.trim(),
      });
    }

    res.status(200).json({ tone, explanation });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
