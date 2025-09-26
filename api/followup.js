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

Return ONLY valid raw JSON. Do NOT include markdown, code blocks, or extra commentary.

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

    // Attempt to clean and parse the JSON
    const cleanedJSON = extractJSON(content);

    if (!cleanedJSON) {
      return res.status(500).json({ error: `Invalid JSON response: ${content}` });
    }

    const { needsFollowUp, followUpBy, reason } = cleanedJSON;

    if (typeof needsFollowUp !== 'boolean' || typeof reason !== 'string') {
      return res.status(500).json({ error: 'Response missing required keys' });
    }

    res.status(200).json({
      needsFollowUp,
      followUpBy: followUpBy || null,
      reason,
    });

  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}

// --- 🔧 Helper Function ---
function extractJSON(text) {
  try {
    // Attempt direct JSON parse first
    return JSON.parse(text);
  } catch {
    // Try to extract from code block like ```json ... ```
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}
