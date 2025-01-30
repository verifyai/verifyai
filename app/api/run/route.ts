import { NextResponse } from "next/server";
import { openAIService } from "@/app/lib/services/openai-service";
import { uploadToImgbb } from "@/app/lib/services/imgbb-service"; // ✅ Import Imgbb uploader

export async function POST(request: Request) {
  try {
    const { screenshotUrl } = await request.json();

    if (!screenshotUrl) {
      throw new Error("Screenshot URL is required.");
    }

    console.log("📸 Screenshot URL:", screenshotUrl);

    // ✅ Fetch image and convert to buffer
    const response = await fetch(screenshotUrl);
    if (!response.ok) throw new Error("Failed to fetch screenshot image.");

    const imageBuffer = await response.arrayBuffer();

    // ✅ Upload to Imgbb without resizing
    const imgbbUrl = await uploadToImgbb(Buffer.from(imageBuffer));

    console.log("✅ Image uploaded to Imgbb:", imgbbUrl);

    // ✅ Send the Imgbb URL to OpenAI (NOT Base64)
    const screenshotAnalysis = await openAIService.analyzeScreenshot(imgbbUrl);

    console.log("🔍 Analysis completed:", screenshotAnalysis);

    return NextResponse.json({
      message: "Analysis completed",
      screenshotAnalysis,
      imgbbUrl,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? `Error: ${error.message}` : "Unknown error",
      },
      { status: 500 }
    );
  }
}
