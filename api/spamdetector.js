export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { emailText } = req.body;
  if (!emailText) return res.status(400).json({ error: 'Missing emailText' });

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct", // or another model supported by OpenRouter
        messages: [
          { role: "system", content: "You are a smart assistant that classifies emails as spam or not spam." },
          { role: "user", content: `Classify the following email as "Spam" or "Not Spam". Provide only the label and reasoning.\n\n${emailText}` }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || "OpenRouter error" });
    }

    const content = data.choices[0]?.message?.content || "";
    const [labelLine, ...rest] = content.split("\n");
    const label = labelLine.trim().toLowerCase().includes("spam") ? "Spam" : "Not Spam";
    const explanation = rest.join("\n").trim();

    return res.status(200).json({ spamStatus: label, explanation });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}
