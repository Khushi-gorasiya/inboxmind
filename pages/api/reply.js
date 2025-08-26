export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.VITE_HUGGINGFACE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `Email: ${emailText}\n\nGenerate a short, polite, professional reply to the above email:`,
          parameters: {
            max_new_tokens: 150,
            temperature: 0.7,
            return_full_text: false,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res
        .status(response.status)
        .json({ error: `Hugging Face API error: ${errorText}` });
    }

    const data = await response.json();
    const reply = data?.[0]?.generated_text?.trim() || 'No reply generated.';
    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
