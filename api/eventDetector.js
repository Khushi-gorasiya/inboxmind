// api/eventDetector.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  const HF_CLASSIFY_MODEL = 'facebook/bart-large-mnli';
  const HF_EXTRACT_MODEL = 'bigscience/bloom-560m';

  try {
    // Step 1: Classification
    const classifyResponse = await fetch(`https://api-inference.huggingface.co/models/${HF_CLASSIFY_MODEL}`, {
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

    if (!classifyResponse.ok) {
      const text = await classifyResponse.text();
      return res.status(classifyResponse.status).json({ error: `Hugging Face classify API error: ${text}` });
    }

    const classifyData = await classifyResponse.json();
    const label = classifyData?.labels?.[0];
    const score = classifyData?.scores?.[0];

    if (label !== 'Meeting' || score < 0.7) {
      return res.status(200).json({ isMeeting: false });
    }

    // Step 2: Extraction prompt
    const prompt = `
Extract meeting details from the following email and respond ONLY with JSON with keys: title, date (ISO 8601 or natural language), time, location.
If no details found, return empty strings for all keys.
Email:
${emailText}
`;

    const extractResponse = await fetch(`https://api-inference.huggingface.co/models/${HF_EXTRACT_MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VITE_HUGGINGFACE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 150,
          temperature: 0,
        },
      }),
    });

    if (!extractResponse.ok) {
      const text = await extractResponse.text();
      return res.status(extractResponse.status).json({ error: `Hugging Face extract API error: ${text}` });
    }

    const extractData = await extractResponse.json();

    const rawOutput = Array.isArray(extractData) ? extractData[0]?.generated_text : extractData.generated_text || extractData;

    // Attempt to parse JSON from output
    let details;
    try {
      details = JSON.parse(rawOutput);
    } catch {
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
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

    if (!details || (!details.date && !details.time)) {
      return res.status(200).json({ isMeeting: false });
    }

    return res.status(200).json({ isMeeting: true, details });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
