export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { emailText } = req.body;
  const HF_API_KEY = process.env.VITE_HUGGINGFACE_TOKEN;

  if (!HF_API_KEY) {
    return res.status(500).json({ error: 'Missing Hugging Face API key in environment' });
  }

  try {
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/meta-llama/Llama-3-8b-chat-hf',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `Summarize the following email:\n\n${emailText}`,
          parameters: {
            max_new_tokens: 256,
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await hfResponse.json();

    return res.status(200).json(data);
  } catch (error) {
    console.error('Hugging Face API Error:', error);
    return res.status(500).json({ error: 'Failed to summarize email' });
  }
}
