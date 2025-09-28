export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  const hfToken = process.env.VITE_HUGGINGFACE_TOKEN;
  if (!hfToken) {
    return res.status(500).json({ error: 'Hugging Face API key not configured' });
  }

  try {
    const prompt = `Classify this email as "Spam" or "Not Spam". Return ONLY a JSON object with keys "label" and "reason".\n\nEmail:\n${emailText}`;

    const response = await fetch('https://api-inference.huggingface.co/models/google/flan-t5-large', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
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

    if (!response.ok) {
      const errorData = await response.text();
      return res.status(response.status).json({ error: errorData || 'Hugging Face API error' });
    }

    const data = await response.json();

    if (!data || !data[0]?.generated_text) {
      return res.status(500).json({ error: 'Empty response from model' });
    }

    const content = data[0].generated_text.trim();

    // Extract JSON object from the model's response string
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Could not find JSON in model response' });
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.label || !parsed.reason) {
        return res.status(500).json({ error: 'JSON missing label or reason' });
      }
      return res.status(200).json({ spamStatus: parsed.label, reason: parsed.reason });
    } catch (err) {
      return res.status(500).json({ error: 'Invalid JSON format from model' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
