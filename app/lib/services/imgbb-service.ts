import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config(); // Load environment variables

export async function uploadToImgbb(imageBuffer: Buffer): Promise<string> {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) throw new Error("Missing IMGBB_API_KEY in .env file");

  // Convert Buffer to Base64
  const base64Image = imageBuffer.toString("base64");

  // Prepare the request
  const formData = new URLSearchParams();
  formData.append("image", base64Image);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });

    const data = await response.json();

    if (!data.success) throw new Error(`Imgbb upload failed: ${data.error.message}`);

    return data.data.url; // ✅ Returns the uploaded image URL
  } catch (error) {
    console.error("Error uploading to Imgbb:", error);
    throw new Error("Failed to upload image to Imgbb.");
  }
}
