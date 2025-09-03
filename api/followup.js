// api/followup.js
export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { emailText } = req.body;
  if (!emailText?.trim())
    return res.status(400).json({ error: 'Missing emailText' });

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
            content: 'You are an assistant that identifies if an email requests a follow-up or reply deadline.'
          },
          {
            role: 'user',
            content: `Analyze the following email. Does it ask for a follow-up or have a reply deadline? 
Return ONLY JSON with keys: "needsFollowUp" (boolean), "followUpBy" (ISO date string or empty), and "reason" (brief text).

Email:
${emailText}
`
          }
        ]
      }),
    });

    const data = await response.json();
    if (!response.ok)
      return res.status(response.status).json({ error: data.error || 'OpenRouter error' });

    const content = data.choices?.[0]?.message?.content;

    // Try to parse JSON response from AI
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      return res.status(500).json({ error: `Invalid JSON response: ${content}` });
    }

    const { needsFollowUp, followUpBy, reason } = parsed;

    if (typeof needsFollowUp !== 'boolean' || typeof reason !== 'string') {
      return res.status(500).json({ error: 'Response missing required keys' });
    }

    res.status(200).json({ needsFollowUp, followUpBy: followUpBy || null, reason });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
