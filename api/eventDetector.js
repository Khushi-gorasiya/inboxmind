export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  const classifierUrl = 'https://api-inference.huggingface.co/models/facebook/bart-large-mnli';
  const extractorUrl = 'https://openrouter.ai/api/v1/chat/completions';

  try {
    // Step 1: Classify whether it's a meeting-related email
    const classifyResponse = await fetch(classifierUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VITE_HUGGINGFACE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: emailText,
        parameters: {
          candidate_labels: ['Meeting', 'Not Meeting'],
          hypothesis_template: 'This email is about a meeting: {}',
        },
      }),
    });

    const classifyData = await classifyResponse.json();
    const label = classifyData?.labels?.[0];
    const score = classifyData?.scores?.[0];

    if (label !== 'Meeting' || score < 0.7) {
      return res.status(200).json({ isMeeting: false });
    }

    // Step 2: Extract details using OpenRouter
    const today = 'August 29, 2025'; // Reference point for relative date phrases

    const extractionPrompt = `
Extract the following meeting details from this email. Use "${today}" as today's date to resolve relative references like "this Friday".

Respond ONLY in JSON like this:
{
  "title": "Meeting Title",
  "date": "Month DD, YYYY",
  "time": "HH:MM AM/PM",
  "location": "Location"
}

If you cannot find a field, set it as an empty string.

Email:
${emailText}
`;

    const extractResponse = await fetch(extractorUrl, {
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
            content: 'You are an AI assistant that extracts meeting details from emails and returns JSON only.',
          },
          {
            role: 'user',
            content: extractionPrompt,
          },
        ],
      }),
    });

    const extractData = await extractResponse.json();
    const content = extractData?.choices?.[0]?.message?.content || '';

    let details = null;

    try {
      // Try to parse as JSON
      details = JSON.parse(content);
    } catch {
      // Fallback regex parsing if not JSON
      const titleMatch = content.match(/title[:\-]?\s*(.*)/i);
      const dateMatch = content.match(/date[:\-]?\s*(.*)/i);
      const timeMatch = content.match(/time[:\-]?\s*(.*)/i);
      const locationMatch = content.match(/location[:\-]?\s*(.*)/i);

      details = {
        title: titleMatch ? titleMatch[1].trim() : '',
        date: dateMatch ? dateMatch[1].trim() : '',
        time: timeMatch
          ? timeMatch[1].split(/[–-]/)[0].trim() // Extract only start time
          : '',
        location: locationMatch ? locationMatch[1].trim() : '',
      };
    }

    // If all fields are empty, no valid event
    const isEmpty =
      !details.title && !details.date && !details.time && !details.location;

    return res.status(200).json({
      isMeeting: !isEmpty,
      details: isEmpty ? null : details,
    });
  } catch (error) {
    console.error('EventDetector error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
