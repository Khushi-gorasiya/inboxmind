// api/followup.js

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
            content: 'You are an assistant that identifies whether an email requests a follow-up or reply deadline.',
          },
          {
            role: 'user',
            content: `Analyze the following email and determine if it requests a follow-up or has a reply deadline.

Return ONLY valid raw JSON. Do NOT include markdown (like \`\`\`json), tags (like <s>, [OUT]), or any commentary.

Format:
{
  "needsFollowUp": boolean,
  "followUpBy": "ISO 8601 date string or empty string",
  "reason": "brief explanation"
}

Email:
${emailText}`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'OpenRouter error' });
    }

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: 'Empty response from model' });
    }

    const cleaned = extractJSON(content);

    if (!cleaned) {
      return res.status(500).json({ error: `Invalid JSON response: ${content}` });
    }

    const { needsFollowUp, followUpBy, reason } = cleaned;

    if (typeof needsFollowUp !== 'boolean' || typeof reason !== 'string') {
      return res.status(500).json({ error: 'Response missing required keys' });
    }

    return res.status(200).json({
      needsFollowUp,
      followUpBy: followUpBy || null,
      reason,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}

// 🧠 Improved JSON Extractor
function extractJSON(text) {
  try {
    // Try parsing as-is
    return JSON.parse(text);
  } catch {
    // Strip common wrappers
    const stripped = text
      .replace(/<s>\s*\[OUT\]/gi, '')
      .replace(/\[\/OUT\]\s*<\/s?>?/gi, '')
      .replace(/```json\s*([\s\S]*?)\s*```/gi, '$1') // remove markdown
      .replace(/```([\s\S]*?)```/gi, '$1')           // catch generic code blocks
      .trim();

    try {
      return JSON.parse(stripped);
    } catch (e) {
      return null;
    }
  }
}
