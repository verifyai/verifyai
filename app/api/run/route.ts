import { NextResponse } from 'next/server';
import { sitemapService } from '@/app/lib/services/sitemap-service';
import { openAIService } from '@/app/lib/services/openai-service';
import { uploadToCloudinary } from '@/app/lib/services/cloudinary-service';
export async function POST(request: Request) {
  try {
    const { websiteUrl, screenshotUrl } = await request.json();

    if (!screenshotUrl) {
      throw new Error('Screenshot URL is required.');
    }

    console.log('Screenshot Url In Run:', screenshotUrl);
    
    // Upload the screenshot to Cloudinary
    const cloudinaryUrl = await uploadToCloudinary(screenshotUrl);

    console.log('Uploaded Screenshot URL:', cloudinaryUrl);

    // Scrape the website URLs
    const scrapedData = await sitemapService.scrapeUrl(websiteUrl);

    // Analyze the scraped links with OpenAI
    const analysis = await openAIService.determineTargetURLs(scrapedData.links);

    // Analyze the screenshot using OpenAI
    const screenshotAnalysis = await openAIService.analyzeScreenshot(
      cloudinaryUrl
    );

    return NextResponse.json({
      message: 'Analysis completed',
      scrapedData,
      analysis,
      screenshotAnalysis,
      cloudinaryUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? `Error: ${error.message}` : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
