export default async function handler(req, res) {
  const { emailText } = req.body;

  const token = import.meta.env.VITE_HUGGINGFACE_TOKEN;

  if (!token) {
    return res.status(500).json({ error: "Missing HuggingFace token" });
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
          inputs: [
            { role: "system", content: "You are an assistant that summarizes emails concisely." },
            { role: "user", content: `Summarize this email: ${emailText}` },
          ],
          parameters: {
            max_new_tokens: 256,
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
}
