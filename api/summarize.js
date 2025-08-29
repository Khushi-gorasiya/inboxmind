export default async function handler(req, res) {
  const { emailText } = req.body;
  const safeText = emailText.slice(0, 2000); // Trim to first ~2000 characters

  try {
    const response = await fetch(SUMMARY_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VITE_HUGGINGFACE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: safeText,
        parameters: {
          truncation: true,
          max_length: 200,   // fine-tune as needed
          min_length: 50,    // ensure enough detail
          do_sample: false,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    return res.status(200).json({
      summary: Array.isArray(data) ? data[0]?.summary_text : data.summary_text,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
