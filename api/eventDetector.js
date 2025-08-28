export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  try {
    const prompt = `Extract the meeting or event details from this email.
Respond ONLY in JSON format as follows:
{
  "title": "event title",
  "date": "YYYY-MM-DD or human-readable date",
  "time": "start time or time range",
  "location": "location or URL"
}
If there is no event, respond with:
{
  "title": "",
  "date": "",
  "time": "",
  "location": ""
}

Email:
${emailText}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://inboxmind-one.vercel.app/',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that extracts event details in JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `OpenRouter API error: ${text}` });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';

    let details = null;

    try {
      details = JSON.parse(content);
    } catch {
      // Fallback: strip emojis and extract with improved regex
      const cleanedContent = content.replace(/[^\x00-\x7F]/g, ''); // Remove emojis/non-ascii

      const titleMatch = cleanedContent.match(/title[:\-]?\s*(.*)/i);
      const dateMatch = cleanedContent.match(/date[:\-]?\s*(.*)/i);
      const timeMatch = cleanedContent.match(/time[:\-]?\s*([\d:apm\s–-]+)/i); // Accept time ranges
      const locationMatch = cleanedContent.match(/location[:\-]?\s*(.*)/i);

      details = {
        title: titleMatch ? titleMatch[1].trim() : '',
        date: dateMatch ? dateMatch[1].trim() : '',
        time: timeMatch ? timeMatch[1].trim() : '',
        location: locationMatch ? locationMatch[1].trim() : '',
      };
    }

    const isMeeting =
      details &&
      (details.title || details.date || details.time || details.location);

    return res.status(200).json({
      isMeeting,
      details,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
