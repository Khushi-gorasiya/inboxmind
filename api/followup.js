// api/followup.js

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
    const body = {
      model: 'mixtral-8x7b-32768', // Groq-supported high-quality model
      messages: [
        {
          role: 'system',
          content:
            'You are an assistant that identifies whether an email requests a follow-up or reply deadline.',
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

If unsure, return valid JSON with "needsFollowUp": false and explain why.

Email:
${emailText}

Always respond ONLY with valid JSON.`,
        },
      ],
    };

    // ✅ Correct Groq endpoint
    const response = await fetch('https://api.groq.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`, // Pulled from Vercel env
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          (data.error && typeof data.error === 'string'
            ? data.error
            : JSON.stringify(data)) || 'Groq API error',
      });
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

// JSON cleaner
function extractJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    try {
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
