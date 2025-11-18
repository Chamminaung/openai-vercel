// api/ocr.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  try {
    const { base64 } = req.body;

    if (!base64) {
      return res.status(400).json({ error: "Missing base64 image." });
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;

    const payload = {
      model: "gpt-4.1-mini",
    input: [
        {
            role: "user",
            content: [
                { type: "input_text", text: `
      You are an expert financial data extractor. The user provides a payment success screenshot.
      From this image, extract the following data and return ONLY a JSON object that strictly adheres to the schema:
      - "transaction_no" (The value of 'Transaction No.')
      - "transfer_to" (The value of 'Transfer To')
      - "amount_ks" (The numeric value of 'Amount', e.g., 5300.00)
      - "transaction_status" (The value of 'Payment Successful' or similar status text)
    ` },
                {
                    type: "input_image",
                    image_url: `data:image/jpeg;base64,${base64Image}`,
                },
            ],
        },
    ],
};

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      return res.status(openaiResponse.status).json({
        error: "OpenAI error",
        detail: data
      });
    }

    // Output text structure differs by model. Try universal extraction.
    const output =
      data?.output_text ??
      data?.choices?.[0]?.message?.content ??
      JSON.stringify(data);

    return res.status(200).json({
      ok: true,
      text: output
    });
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      detail: err.message
    });
  }
}
