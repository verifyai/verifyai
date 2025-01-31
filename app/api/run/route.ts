import { NextResponse } from "next/server";
import { openAIService } from "@/app/lib/services/openai-service";
import { uploadToImgbb } from "@/app/lib/services/imgbb-service"; // ✅ Import Imgbb uploader
import { broadcastAlert } from '@/app/lib/eventEmitter';

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

    // ✅ Upload to Imgbb
    const imgbbUrl = await uploadToImgbb(Buffer.from(imageBuffer));

    broadcastAlert({
      type: 'ImgBB',
      message: `Screenshot uploaded to the web`,
      timestamp: Date.now(),
    });

    console.log("✅ Image uploaded to Imgbb:", imgbbUrl);

    // ✅ Send the Imgbb URL to OpenAI
    broadcastAlert({
      type: 'OpenAI',
      message: `Sending screenshot to OpenAI`,
      timestamp: Date.now(),
    });

    const openAIResponse = await openAIService.analyzeScreenshot(imgbbUrl);

    console.log("🔍 Raw OpenAI Response:", openAIResponse);

    // ✅ Parse the `message` property (which contains the JSON as a string)
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(openAIResponse.message as string);
    } catch (parseError) {
      console.error("❌ Error parsing OpenAI message:", parseError);
      throw new Error("Failed to parse OpenAI response message.");
    }

    console.log("✅ Parsed OpenAI Message:", parsedMessage);

    // ✅ Ensure the parsed response follows the expected structure
    const screenshotAnalysis = {
      score: parsedMessage.score ?? 0,
      metadata: {
        summary: parsedMessage.metadata?.summary ?? "No summary available.",
        restrictedItems: parsedMessage.metadata?.restrictedItems ?? { score: 0, message: "No data available." },
        productPages: parsedMessage.metadata?.productPages ?? { score: 0, message: "No data available." },
        ownership: parsedMessage.metadata?.ownership ?? { score: 0, message: "No data available." },
        overallSafety: parsedMessage.metadata?.overallSafety ?? { score: 0, message: "No data available." },
      },
    };

    return NextResponse.json({
      message: "Analysis completed",
      screenshotAnalysis, // ✅ Pass the parsed and structured response
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


