// api/eventDetector.js

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { emailText } = req.body;
  if (!emailText?.trim()) return res.status(400).json({ error: "Missing emailText" });

  try {
    // 1. Classify if the email is about a meeting
    const classifyRes = await fetch("https://api-inference.huggingface.co/models/facebook/bart-large-mnli", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.VITE_HUGGINGFACE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: emailText,
        parameters: {
          candidate_labels: ["Meeting", "Not Meeting"],
          hypothesis_template: "This text is about a meeting: {}",
        },
      }),
    });
    if (!classifyRes.ok) throw new Error(await classifyRes.text());
    const classifyData = await classifyRes.json();
    const [label, score] = [classifyData.labels?.[0], classifyData.scores?.[0]];

    if (label !== "Meeting" || score < 0.7) return res.status(200).json({ isMeeting: false });

    // 2. If it’s a meeting, extract date/time using a date-specialized model
    const extractRes = await fetch("https://api-inference.huggingface.co/models/skunkthink/date-time-model", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.VITE_HUGGINGFACE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: emailText }),
    });
    if (!extractRes.ok) throw new Error(await extractRes.text());
    const extractData = await extractRes.json();

    // Assuming model returns structured output:
    // { date: "2025-09-10", time: "14:30", title: "Team meeting", location: "Zoom" }
    const details = {
      title: extractData.title || "",
      date: extractData.date || "",
      time: extractData.time || "",
      location: extractData.location || "",
    };

    res.status(200).json({ isMeeting: true, details });
  } catch (err) {
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}
