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
            content: 'You are an assistant that ONLY responds in raw JSON with "label" and "reason" — no markdown or extra formatting.'
          },
          {
            role: 'user',
            content: `Classify this email as "Spam" or "Not Spam". Respond ONLY with a JSON object like this: {"label": "...", "reason": "..."}. No markdown.\n\nEmail:\n${emailText}`
          }
        ],
        // If OpenRouter supports forcing JSON mode (some models do), you could also try:
        // "response_format": "json"
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'OpenRouter error' });
    }

    const rawContent = data.choices?.[0]?.message?.content?.trim();

    // Clean and extract valid JSON from potentially noisy response
    function extractJSON(text) {
      try {
        // Attempt raw parse first
        return JSON.parse(text);
      } catch {
        // If wrapped in markdown, extract JSON inside ```json ... ```
        const match = text.match(/```json\s*([\s\S]*?)```/i);
        if (match) {
          return JSON.parse(match[1].trim());
        }
        // Remove HTML-like tags and retry
        const cleaned = text.replace(/<[^>]+>/g, '').replace(/\[.*?\]/g, '').trim();
        return JSON.parse(cleaned);
      }
    }

    let parsed;
    try {
      parsed = extractJSON(rawContent);
    } catch (e) {
      return res.status(500).json({ error: `Invalid JSON format: ${rawContent}` });
    }

    const { label, reason } = parsed;
    if (!label || !reason) throw new Error('Missing label or reason in response');

    return res.status(200).json({ spamStatus: label, reason });
  } catch (err) {
    console.error('SpamDetector API error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
