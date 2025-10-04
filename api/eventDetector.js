export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_TOKEN;

  if (!HUGGINGFACE_TOKEN) {
    return res.status(500).json({ error: 'Hugging Face API key not configured' });
  }

  const HF_CLASSIFY_MODEL = 'facebook/bart-large-mnli'; // Zero-shot classification model
  const HF_EXTRACT_MODEL = 'google/flan-t5-large'; // Instruction-tuned text2text model

  try {
    // Step 1: Zero-shot classify if email is about a meeting
    const classifyResponse = await fetch(`https://api-inference.huggingface.co/models/${HF_CLASSIFY_MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: emailText,
        parameters: {
          candidate_labels: ['a meeting', 'not a meeting'],
          hypothesis_template: 'This is about {}.',
        },
      }),
    });

    if (!classifyResponse.ok) {
      const text = await classifyResponse.text();
      console.error('Hugging Face classification API error:', text);
      return res.status(classifyResponse.status).json({ error: `Hugging Face classification API error: ${text}` });
    }

    const classifyData = await classifyResponse.json();

    const label = classifyData.labels?.[0];
    const score = classifyData.scores?.[0];

    if (label !== 'a meeting' || score < 0.7) {
      // Not confident it's a meeting
      return res.status(200).json({ isMeeting: false });
    }

    // Step 2: Extract meeting details with instruction prompt
    const extractPrompt = `Extract the meeting or event details from this email as JSON with the keys: title, date (ISO 8601 or natural language), time (24h or natural language), location. If no event found, respond with {"title": "", "date": "", "time": "", "location": ""}.\nEmail:\n${emailText}`;

    const extractResponse = await fetch(`https://api-inference.huggingface.co/models/${HF_EXTRACT_MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: extractPrompt,
        parameters: {
          max_new_tokens: 256,
          return_full_text: false,
        },
      }),
    });

    if (!extractResponse.ok) {
      const text = await extractResponse.text();
      return res.status(extractResponse.status).json({ error: `Hugging Face extract API error: ${text}` });
    }

    const extractData = await extractResponse.json();

    if (!extractData || !extractData.generated_text) {
      return res.status(200).json({ isMeeting: false });
    }

    const content = extractData.generated_text.trim();
    console.log('Hugging Face extraction response:', content);

    // Helper to parse JSON from model output
    function extractJSON(text) {
      try {
        return JSON.parse(text);
      } catch {
        try {
          const cleaned = text
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

    if (!details) {
      console.warn('Failed to parse JSON from Hugging Face extract:', content);
      return res.status(200).json({ isMeeting: false });
    }

    if (!details.date && !details.time) {
      // No valid event date/time found
      return res.status(200).json({ isMeeting: false });
    }

    // Return the extracted meeting details
    return res.status(200).json({ isMeeting: true, details });
  } catch (error) {
    console.error('Event Detector Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
