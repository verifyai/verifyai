import { NextResponse } from 'next/server';
import { sitemapService } from '@/app/lib/services/sitemap-service';
import { openAIService } from '@/app/lib/services/openai-service';

export async function POST(request: Request) {
  try {
    const { websiteUrl } = await request.json();

    //First scrape the URLs
    const scrapedData = await sitemapService.scrapeUrl(websiteUrl);

    // Then analyze them with OpenAI
    const analysis = await openAIService.determineTargetURLs(scrapedData.links);

    return NextResponse.json({
      message: 'Request processed successfully',
      data: scrapedData,
      analysis: analysis,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `An error occurred in api/run ${error.message}`
            : 'An error occurred in api/run',
      },
      { status: 500 }
    );
  }
}
