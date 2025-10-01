// api/eventDetector.js

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
    const prompt = `Is this email about a meeting or event? If yes, extract the title, date, time, and location. Email:\n\n${emailText}`;

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
      // Not confident that it's a meeting
      return res.status(200).json({ isMeeting: false });
    }

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
            content: `Extract the meeting or event title, date, time, and location from this email. If not found, respond with "No event found". Email:\n\n${emailText}`,
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

    if (content.toLowerCase().includes('no event found')) {
      return res.status(200).json({ isMeeting: false });
    }

    let details = null;

    try {
      details = JSON.parse(content);
    } catch {
      
      const titleMatch = content.match(/title[:\-]\s*(.*)/i);
      const dateMatch = content.match(/date[:\-]\s*(.*)/i);
      const timeMatch = content.match(/time[:\-]\s*(.*)/i);
      const locationMatch = content.match(/location[:\-]\s*(.*)/i);

      details = {
        title: titleMatch ? titleMatch[1].trim() : '',
        date: dateMatch ? dateMatch[1].trim() : '',
        time: timeMatch ? timeMatch[1].trim() : '',
        location: locationMatch ? locationMatch[1].trim() : '',
      };
    }

    return res.status(200).json({ isMeeting: true, details });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
