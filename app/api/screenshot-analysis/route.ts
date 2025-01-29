import type { NextApiRequest, NextApiResponse } from "next";
import fetch from "node-fetch";
import FormData from "form-data";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { screenshot } = req.body;

  if (!screenshot) {
    return res.status(400).json({ error: "Screenshot is required" });
  }

  try {
    const buffer = Buffer.from(screenshot, "base64");

    const formData = new FormData();
    formData.append("file", buffer, {
      filename: "screenshot.png",
      contentType: "image/png",
    });
    formData.append("purpose", "classification");

    const response = await fetch("https://api.openai.com/v1/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      return res.status(500).json({ error: "Failed to analyze screenshot" });
    }

    const analysis = await response.json();
    res.status(200).json({ analysis });
  } catch (error) {
    console.error("Error analyzing screenshot:", error);
    res.status(500).json({ error: "Error analyzing screenshot" });
  }
}
