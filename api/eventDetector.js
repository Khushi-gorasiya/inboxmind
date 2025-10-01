export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  const API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-mnli';

  try {
    // Step 1: Classify if email is about meeting
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VITE_HUGGINGFACE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: emailText,
        parameters: {
          candidate_labels: ['Meeting', 'Not Meeting'],
          hypothesis_template: 'This text is about a meeting: {}',
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `Hugging Face API error: ${text}` });
    }

    const data = await response.json();
    const label = data?.labels?.[0];
    const score = data?.scores?.[0];

    if (label !== 'Meeting' || score < 0.7) {
      // Not confident it's a meeting
      return res.status(200).json({ isMeeting: false });
    }

    // Step 2: Extract meeting details with strict JSON output
    const extractResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
            content: 'You are an AI assistant that extracts meeting or event details from an email.',
          },
          {
            role: 'user',
            content: `Extract the meeting or event details from this email as JSON with the keys: title, date (ISO 8601 or natural language), time (24h or natural language), location. If no event found, respond with {"title": "", "date": "", "time": "", "location": ""}. Email:\n\n${emailText}`,
          },
        ],
      }),
    });

    if (!extractResponse.ok) {
      const text = await extractResponse.text();
      return res.status(extractResponse.status).json({ error: `OpenRouter API error: ${text}` });
    }

    const extractData = await extractResponse.json();
    const content = extractData?.choices?.[0]?.message?.content || '';

    // Extract JSON helper function
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

    const details = extractJSON(content);

    if (!details || (!details.date && !details.time)) {
      // No valid event found
      return res.status(200).json({ isMeeting: false });
    }

    // Return meeting details
    return res.status(200).json({ isMeeting: true, details });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
