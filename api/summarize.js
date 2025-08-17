import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Parse JSON body safely
  let body;
  try {
    body = req.body;

    // If req.body is empty, parse it manually
    if (!body || Object.keys(body).length === 0) {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const rawBody = Buffer.concat(chunks).toString();
      body = JSON.parse(rawBody);
    }
  } catch (err) {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const { emailText } = body;

  if (!emailText) {
    return res.status(400).json({ error: "Missing emailText in body" });
  }

  const token = process.env.HUGGINGFACE_API_TOKEN;

  if (!token) {
    console.error("❌ Missing HuggingFace API token");
    return res.status(500).json({ error: "Missing API token" });
  }

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/meta-llama/Llama-3-8b-chat-hf",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `Summarize this email: ${emailText}`,
          parameters: {
            max_new_tokens: 256,
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error("❌ HuggingFace API Error:", data);
      return res.status(500).json({ error: data.error });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("❌ Serverless function error:", error);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
}
