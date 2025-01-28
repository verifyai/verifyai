import { NextResponse } from "next/server";
import { sitemapService } from "@/app/lib/services/sitemap-service";
import { openAIService } from "@/app/lib/services/openai-service";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // First scrape the URLs
    const scrapedData = await sitemapService.scrapeUrl(url);

    // Then analyze them with OpenAI
    const analysis = await openAIService.determineTargetURLs(scrapedData.links);

    return NextResponse.json({
      message: "Request processed successfully",
      data: scrapedData,
      analysis: analysis,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred" },
      { status: 500 }
    );
  }
}
