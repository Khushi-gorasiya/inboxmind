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
            content: 'You are an assistant that responds with ONLY valid JSON with keys "label" and "reason". No markdown, no extra commentary.'
          },
          {
            role: 'user',
            content: `Classify this email as "Spam" or "Not Spam". Return ONLY a JSON object like {"label":"...", "reason":"..."}.\n\nEmail:\n${emailText}`
          }
        ]
        // (If the model supports a direct JSON output mode, add that parameter here)
      }),
    });

    const data = await response.json();

    // Log full raw model content
    const rawContent = data.choices?.[0]?.message?.content;
    console.log('=== RAW MODEL CONTENT START ===');
    console.log(rawContent);
    console.log('=== RAW MODEL CONTENT END ===');

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'OpenRouter error' });
    }
    if (!rawContent) {
      return res.status(500).json({ error: 'Model returned empty content' });
    }

    function extractAndParseJSON(text) {
      // Try direct parse
      try {
        return JSON.parse(text);
      } catch (_) {}

      // Try JSON block
      const block = text.match(/```json\s*([\s\S]*?)```/i);
      if (block && block[1]) {
        try {
          return JSON.parse(block[1].trim());
        } catch (_) {}
      }

      // Sanitize and try again
      const cleaned = text
        .replace(/<[^>]*>/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/```json|```/gi, '')
        .trim();

      try {
        return JSON.parse(cleaned);
      } catch (e) {
        throw new Error(`Could not parse JSON from cleaned text. Cleaned text: "${cleaned}"`);
      }
    }

    let parsed;
    try {
      parsed = extractAndParseJSON(rawContent);
    } catch (e) {
      return res.status(500).json({ error: `JSON parse error: ${e.message}`, raw: rawContent });
    }

    const { label, reason } = parsed;
    if (!label || !reason) {
      return res.status(500).json({ error: 'Parsed JSON missing label or reason', parsed });
    }

    return res.status(200).json({ spamStatus: label, reason });
  } catch (err) {
    console.error('Spam detector internal error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
