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
            content:
              'You are an assistant that analyzes the tone of an email and responds ONLY with raw JSON (no markdown). JSON format: { "tone": "value", "explanation": "value" }',
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

    let content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in model response');
    }

    // Remove markdown wrappers if present
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```|```([\s\S]*?)```/i);
    if (jsonMatch) {
      content = jsonMatch[1] || jsonMatch[2];
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return res.status(200).json({
        tone: 'Unknown',
        explanation: content.trim(),
      });
    }

    const { tone, explanation } = parsed;

    if (!tone || !explanation) {
      return res.status(200).json({
        tone: 'Unknown',
        explanation: content.trim(),
      });
    }

    res.status(200).json({ tone, explanation });
  } catch (err) {
    console.error('Tone Analyzer Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
