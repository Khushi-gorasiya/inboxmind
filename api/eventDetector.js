// api/eventDetector.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  const HF_TOKEN = process.env.VITE_HUGGINGFACE_TOKEN;
  if (!HF_TOKEN) {
    return res.status(500).json({ error: 'Hugging Face API token not configured' });
  }

  const HF_CLASSIFY_MODEL = 'facebook/bart-large-mnli';
  const HF_EXTRACT_MODEL = 'google/flan-t5-xl'; // or 'google/flan-t5-base' for smaller model

  try {
    // Step 1: Classify if email is about a meeting
    const classifyResponse = await fetch(`https://api-inference.huggingface.co/models/${HF_CLASSIFY_MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
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

    if (!classifyResponse.ok) {
      const text = await classifyResponse.text();
      return res.status(classifyResponse.status).json({ error: `Hugging Face classify API error: ${text}` });
    }

    const classifyData = await classifyResponse.json();
    const label = classifyData?.labels?.[0];
    const score = classifyData?.scores?.[0];

    if (label !== 'Meeting' || score < 0.7) {
      // Not confident it's a meeting
      return res.status(200).json({ isMeeting: false });
    }

    // Step 2: Extract meeting details using text2text-generation model
    // Construct prompt for FLAN-T5
    const prompt = `Extract the meeting or event details from this email as JSON with keys: title, date (ISO 8601 or natural language), time (24h or natural language), location. 
If no event found, respond with {"title": "", "date": "", "time": "", "location": ""}. 
Email:\n\n${emailText}`;

    const extractResponse = await fetch(`https://api-inference.huggingface.co/models/${HF_EXTRACT_MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        options: { wait_for_model: true },
      }),
    });

    if (!extractResponse.ok) {
      const text = await extractResponse.text();
      return res.status(extractResponse.status).json({ error: `Hugging Face extract API error: ${text}` });
    }

    const extractData = await extractResponse.json();

    // The response is typically an array of generated strings; get first item
    let generatedText = '';
    if (Array.isArray(extractData)) {
      generatedText = extractData[0]?.generated_text || '';
    } else if (typeof extractData.generated_text === 'string') {
      generatedText = extractData.generated_text;
    } else {
      generatedText = JSON.stringify(extractData);
    }

    // Try to parse JSON from generated text
    let details;
    try {
      details = JSON.parse(generatedText.trim());
    } catch {
      // If parsing fails, try to extract JSON-looking substring
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          details = JSON.parse(jsonMatch[0]);
        } catch {
          details = null;
        }
      } else {
        details = null;
      }
    }

    if (!details || (!details.date && !details.time && !details.title && !details.location)) {
      return res.status(200).json({ isMeeting: false });
    }

    // Return meeting details
    return res.status(200).json({ isMeeting: true, details });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
