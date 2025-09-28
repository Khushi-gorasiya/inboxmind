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
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: [
          {
            role: 'system',
            content: 'Respond ONLY with a JSON object with keys "label" and "reason". No markdown, no explanation, no code blocks.'
          },
          {
            role: 'user',
            content: `Is this email spam or not?\n\nEmail:\n${emailText}\n\nRespond ONLY with: {"label": "Spam" or "Not Spam", "reason": "..."}`
          }
        ]
      }),
    });

    const result = await response.json();

    const content = result.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return res.status(500).json({ error: 'Empty response from model' });
    }

    let parsed;
    try {
      // Try direct parse
      parsed = JSON.parse(content);
    } catch (e1) {
      // Try to extract from markdown block
      const match = content.match(/```json\s*([\s\S]*?)```/i);
      if (match) {
        try {
          parsed = JSON.parse(match[1].trim());
        } catch (e2) {
          return res.status(500).json({ error: 'Invalid JSON inside markdown block', raw: match[1].trim() });
        }
      } else {
        // Clean garbage like <s> or [OUT] and retry
        const cleaned = content
          .replace(/<[^>]*>/g, '')
          .replace(/\[[^\]]*\]/g, '')
          .replace(/```json|```/g, '')
          .trim();
        try {
          parsed = JSON.parse(cleaned);
        } catch (e3) {
          return res.status(500).json({ error: 'Final JSON parse failed', raw: cleaned });
        }
      }
    }

    const { label, reason } = parsed;

    if (!label || !reason) {
      return res.status(500).json({ error: 'Response missing label or reason', parsed });
    }

    return res.status(200).json({
      spamStatus: label,
      reason: reason
    });

  } catch (err) {
    console.error('Spam detector error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
