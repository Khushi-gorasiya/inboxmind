export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'Missing emailText in request body' });
  }

  const HF_API_URL = 'https://api-inference.huggingface.co/models/Thiyaga158/Distilbert_Ner_Model_For_Email_Event_Extraction';

  try {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VITE_HUGGINGFACE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: emailText }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: `Hugging Face error: ${err}` });
    }

    const data = await response.json();

    // Group tokens by entity
    const grouped = data.reduce((acc, item) => {
      const key = item.entity_group || item.entity;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item.word);
      return acc;
    }, {});

    const clean = (tokens) =>
      tokens?.join(' ').replace(/\s([.,])/g, '$1').replace(/▁/g, ' ').trim() || '';

    const eventDetails = {
      title: clean(grouped['EVENT_NAME']),
      date: clean(grouped['DATE']),
      time: clean(grouped['TIME']),
      location: clean(grouped['VENUE']),
    };

    const isValid =
      eventDetails.title || eventDetails.date || eventDetails.time || eventDetails.location;

    return res.status(200).json({ isMeeting: !!isValid, details: eventDetails });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
