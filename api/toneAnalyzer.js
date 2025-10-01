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
    console.log('OpenRouter raw data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.error || 'Tone analysis failed');
    }

    let content = data.choices?.[0]?.message?.content;
    console.log('Model content:', content);

    if (!content) {
      throw new Error('No content from AI');
    }

    // Strip markdown wrappers if present
    const match = content.match(/```json\s*([\s\S]*?)\s*```|```([\s\S]*?)```/i);
    if (match) {
      content = match[1] || match[2];
      console.log('Content after stripping markdown:', content);
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseErr) {
      console.error('JSON parse failed:', parseErr);
      // Fallback: send unknown tone and explanation = full content
      return res.status(200).json({
        tone: 'Unknown',
        explanation: content.trim(),
      });
    }

    console.log('Parsed JSON:', parsed);

    const { tone, explanation } = parsed;

    if (!tone || !explanation || typeof tone !== 'string' || typeof explanation !== 'string') {
      console.warn('Parsed object missing keys or wrong type', parsed);
      // Fallback
      return res.status(200).json({
        tone: 'Unknown',
        explanation: content.trim(),
      });
    }

    // Success
    console.log('Responding with tone & explanation', tone, explanation);
    return res.status(200).json({ tone, explanation });
  } catch (err) {
    console.error('ToneAnalyzer internal error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
