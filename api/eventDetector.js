export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { emailText } = req.body;
  if (!emailText?.trim()) return res.status(400).json({ error: 'Missing emailText' });

  try {
    const classifyRes = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-mnli', {
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
    if (!classifyRes.ok) throw new Error(await classifyRes.text());
    const classifyData = await classifyRes.json();
    const [label, score] = [classifyData.labels?.[0], classifyData.scores?.[0]];
    if (label !== 'Meeting' || score < 0.7) return res.status(200).json({ isMeeting: false });

    const extractRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: [
          { role: 'system', content: 'Extract meeting title, date, time, and location from the email.' },
          { role: 'user', content: emailText },
        ],
      }),
    });
    if (!extractRes.ok) throw new Error(await extractRes.text());
    const extractData = await extractRes.json();
    const content = extractData.choices?.[0]?.message?.content || '';
    if (content.toLowerCase().includes('no event found')) return res.status(200).json({ isMeeting: false });

    let details;
    try {
      details = JSON.parse(content);
    } catch {
      const match = (label) => (new RegExp(`${label}[:\\-]\\s*(.*)`, 'i').exec(content)?.[1] || '');
      details = {
        title: match('title'),
        date: match('date'),
        time: match('time'),
        location: match('location'),
      };
    }
    res.status(200).json({ isMeeting: true, details });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
