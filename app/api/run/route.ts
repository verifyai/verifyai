import { NextResponse } from "next/server";
// import { sitemapService } from "@/app/lib/services/sitemap-service";
import { openAIService } from "@/app/lib/services/openai-service";
import { uploadToImgbb } from "@/app/lib/services/imgbb-service"; // ✅ Import Imgbb uploader
import sharp from "sharp";

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

    // ✅ Resize image using sharp
    const resizedImageBuffer = await sharp(Buffer.from(imageBuffer))
      .resize({
        width: 2000, // Max width
        height: 768, // Max height
        fit: "inside", // Maintain aspect ratio
      })
      .jpeg({ quality: 75 }) // Reduce file size with compression
      .toBuffer();

    // ✅ Upload to Imgbb
    const imgbbUrl = await uploadToImgbb(resizedImageBuffer);

    console.log("✅ Image uploaded to Imgbb:", imgbbUrl);

    // // ✅ Scrape the website URLs
    // const scrapedData = await sitemapService.scrapeUrl(websiteUrl);

    // // ✅ Analyze the scraped links with OpenAI
    // const analysis = await openAIService.determineTargetURLs(scrapedData.links);

    // ✅ Send the Imgbb URL to OpenAI (NOT Base64)
    const screenshotAnalysis = await openAIService.analyzeScreenshot(imgbbUrl);

    console.log("🔍 Analysis completed:", screenshotAnalysis);

    return NextResponse.json({
      message: "Analysis completed",
      // scrapedData,
      // analysis,
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
