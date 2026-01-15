import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Only allow POST requests
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const { messages, temperature, response_format } = request.body;

  const MISTRAL_API_KEY =
    process.env.MISTRAL_API_KEY || process.env.VITE_MISTRAL_API_KEY;
  const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

  if (!MISTRAL_API_KEY) {
    return response
      .status(500)
      .json({ error: "API Key not configured on server" });
  }

  try {
    const body: any = {
      model: "mistral-small",
      messages,
      temperature: temperature || 0.3,
    };

    if (response_format) {
      body.response_format = response_format;
    }

    const mistralResponse = await fetch(MISTRAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!mistralResponse.ok) {
      const errorText = await mistralResponse.text();
      console.error("Mistral API Error:", errorText);
      return response
        .status(mistralResponse.status)
        .json({ error: "AI API error" });
    }

    const data = await mistralResponse.json();
    return response.status(200).json(data);
  } catch (error) {
    console.error("Proxy Error:", error);
    return response.status(500).json({ error: "Internal server error" });
  }
}
