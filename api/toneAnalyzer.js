// api/toneAnalyzer.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText?.trim()) {
    return res.status(400).json({ error: 'Missing emailText' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured in environment' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are an assistant that analyzes the tone of an email and responds ONLY with raw JSON like this: {"tone": "Formal", "explanation": "Explanation here"}. No markdown, no code blocks.',
          },
          {
            role: 'user',
            content: `Analyze the tone of the following email:\n\n${emailText}`,
          },
        ],
      }),
    });

    const data = await response.json();

    let content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return res.status(200).json({
        tone: 'Unknown',
        explanation: 'No response content found from model.',
      });
    }

    // Clean up potential formatting issues from the model
    content = content
      .replace(/```json\s*/gi, '')
      .replace(/```/g, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      console.warn('⚠️ JSON parsing failed. Returning raw content.');
      return res.status(200).json({
        tone: 'Unknown',
        explanation: content,
      });
    }

    const { tone, explanation } = parsed;

    if (typeof tone !== 'string' || typeof explanation !== 'string') {
      return res.status(200).json({
        tone: 'Unknown',
        explanation: JSON.stringify(parsed),
      });
    }

    return res.status(200).json({ tone, explanation });
  } catch (err) {
    console.error('🔥 Tone Analyzer Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
