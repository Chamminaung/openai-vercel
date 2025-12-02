// api/ocr.js
import OpenAI from "openai";


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// for test open file system and convert to base64
// import fs from "fs";
// const imagePath = "C:\\Users\\Cham Min Aung\\Downloads\\ss.png"; // Replace with your image path
// const base64Image = fs.readFileSync(imagePath, { encoding: "base64" });
//console.log("Base64 Image:", base64Image);

// Function to extract text from image using OpenAI OCR

export async function extractTextFromImage(base64Image) {
  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
    input: [
        {
            role: "user",
            content: [
                { type: "input_text", text: `
      You are an expert financial data extractor. The user provides a payment success screenshot.
      From this image, extract the following data and return ONLY a JSON object format like this (carlibreak between backticks) to  parsed with JSON.parse(text) that strictly adheres to the schema:
      - "transaction_time" (The value of 'Transaction Date and Time'. Format: 'YYYY-MM-DD HH:MM:SS')
      - "transaction_no" (The value of 'Transaction No.')
      - "transfer_to" (The value of 'Transfer To' or 'name' of the recipient)
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
});
    console.log(response.output_text);
    return response.output_text;
  } catch (error) {
    console.log("🔥 OPENAI OCR ERROR:", error?.response?.data ?? error.message);
    return null;
  }
}

// const res = await extractTextFromImage(base64Image);
function convertToSingleBacktick(text) {
  // 1. Remove ```json or ```language
  let result = text.replace(/```[a-zA-Z]*/g, "");

  // 2. Remove ending ```
  result = result.replace(/```/g, "");

  // 3. Wrap with single backtick
  result = "`" + result.trim() + "`";

  return result;
}

// const cleanedRes = convertToSingleBacktick(res);
// console.log("Extracted Text:", cleanedRes);

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*"); // or restrict to your domain
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  try {
    const { base64 } = req.body;

    if (!base64) {
      return res.status(400).json({ error: "Missing base64 image." });
    }

    const output = await extractTextFromImage(base64);

    if (!output) {
      return res.status(500).json({ error: "Failed to extract text from image." });
    }

    output = convertToSingleBacktick(output);

    return res.status(200).json({
      ok: true,
      text: output,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      detail: err.message,
    });
  }
}