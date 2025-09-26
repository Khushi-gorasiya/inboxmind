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
        model: 'openchat/openchat-7b:free',
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

If you're unsure, still return a valid JSON response with "needsFollowUp": false and explain why.

Email:
${emailText}`,
          },
        ],
      }),
    });

    const data = await response.json();

    // TEMP: Debug the raw model output
    console.log('🧠 AI Raw Output:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'OpenRouter error' });
    }

    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return res.status(500).json({
        error: 'The AI did not return any response. Try simplifying the email or try again later.',
      });
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

// 🧠 JSON Extractor — Handles raw, markdown, and tag-wrapped formats
function extractJSON(text) {
  try {
    // Try parsing raw
    return JSON.parse(text);
  } catch {
    try {
      // Remove common wrappers
      const cleaned = text
        .replace(/<s>\s*\[OUT\]/gi, '')
        .replace(/\[\/OUT\]\s*<\/s?>?/gi, '')
        .replace(/```json\s*/gi, '')
        .replace(/```/g, '')
        .trim();

      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}
