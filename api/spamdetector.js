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
            content: 'Respond ONLY with a raw JSON object using keys "label" and "reason". Do NOT include markdown or explanations.'
          },
          {
            role: 'user',
            content: `Is the following email spam? Return ONLY a JSON object like: {"label": "Spam", "reason": "..."}. No markdown.\n\nEmail:\n${emailText}`
          }
        ]
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'OpenRouter error' });
    }

    const rawContent = data.choices?.[0]?.message?.content?.trim();

    // DEV DEBUGGING: Uncomment during testing
    // console.log('RAW RESPONSE FROM MODEL:', rawContent);

    // Function to extract and parse JSON from noisy or wrapped response
    function extractAndParseJSON(rawText) {
      if (!rawText) throw new Error('Empty model response');

      // Try direct JSON parse first
      try {
        return JSON.parse(rawText);
      } catch (_) {}

      // Try extracting from ```json ... ```
      const codeBlockMatch = rawText.match(/```json\s*([\s\S]*?)```/i);
      if (codeBlockMatch) {
        try {
          return JSON.parse(codeBlockMatch[1].trim());
        } catch (_) {}
      }

      // Try stripping any angle brackets or bracketed tokens like <s>, [OUT]
      const cleaned = rawText
        .replace(/<[^>]*>/g, '') // Remove <...>
        .replace(/\[[^\]]*\]/g, '') // Remove [...]
        .replace(/```json|```/g, '') // Remove leftover code block fences
        .trim();

      try {
        return JSON.parse(cleaned);
      } catch (_) {
        throw new Error('Could not find valid JSON in model response');
      }
    }

    let parsed;
    try {
      parsed = extractAndParseJSON(rawContent);
    } catch (err) {
      return res.status(500).json({ error: `Invalid JSON: ${err.message}\n\nRaw content: ${rawContent}` });
    }

    const { label, reason } = parsed;
    if (!label || !reason) {
      return res.status(500).json({ error: 'Parsed JSON missing "label" or "reason"' });
    }

    return res.status(200).json({ spamStatus: label, reason });
  } catch (err) {
    console.error('Spam detector error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
