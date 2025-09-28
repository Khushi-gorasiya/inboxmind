export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: "Missing emailText in request body" });
  }

  const hfToken = process.env.VITE_HUGGINGFACE_TOKEN;
  if (!hfToken) {
    return res.status(500).json({ error: "Hugging Face API key not configured" });
  }

  try {
    const response = await fetch("https://api-inference.huggingface.co/models/nbroad/roberta-base-sms-spam", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: emailText
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      return res.status(response.status).json({ error: errorData || "Model request failed" });
    }

    const result = await response.json();

    // Validate result structure
    if (!Array.isArray(result) || !result[0]) {
      return res.status(500).json({ error: "Empty or invalid response from model" });
    }

    const output = result[0]; // Typically [{ label: 'spam' | 'ham', score: 0.98 }]
    const label = output.label.toLowerCase() === "spam" ? "Spam" : "Not Spam";
    const reason = label === "Spam"
      ? "The email content resembles typical spam patterns."
      : "The email appears to be safe and legitimate.";

    return res.status(200).json({ spamStatus: label, reason });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
