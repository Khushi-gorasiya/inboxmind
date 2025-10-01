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
              'You are an assistant that analyzes the tone of an email and responds ONLY with raw JSON like this: {"tone": "Formal", "explanation": "Explanation here"} — do NOT wrap it in markdown or any code blocks.',
          },
          {
            role: 'user',
            content: `Analyze the tone of the following email:\n\n${emailText}`,
          },
        ],
      }),
    });

    const data = await response.json();

    // Extract the AI's text output
    let content = data?.choices?.[0]?.message?.content?.trim();
    console.log('🧠 AI Response Content:', content);

    if (!content) {
      return res.status(200).json({
        tone: 'Unknown',
        explanation: 'No response content found from model.',
      });
    }

    // Try to extract JSON from markdown code block
    const match = content.match(/```json\s*([\s\S]*?)\s*```|```([\s\S]*?)```/i);
    if (match) {
      content = match[1] || match[2];
      console.log('📦 Extracted JSON string:', content);
    }

    // Attempt to parse the cleaned content
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      console.warn('⚠️ JSON parsing failed, returning raw content.');
      return res.status(200).json({
        tone: 'Unknown',
        explanation: content,
      });
    }

    const { tone, explanation } = parsed;

    if (typeof tone !== 'string' || typeof explanation !== 'string') {
      console.warn('⚠️ Parsed JSON is missing required fields.');
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
