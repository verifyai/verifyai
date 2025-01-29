import { NextResponse } from "next/server";
import { scraperService } from "@/app/lib/services/scraper-service";
import { openAIService } from "@/app/lib/services/openai-service";
import { openAIServiceScrapeRating } from "@/app/lib/services/openai-service";
import { pineconeService } from "@/app/lib/services/pinecone-service";
import { pineconeRestrictedService } from "@/app/lib/services/pineconeQuery-service";
export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Scrape products
    const products = await scraperService.scrapeProducts(url);
    console.log(products);
    // Generate embeddings
    const embeddings = await openAIService.embedProducts(products);
    console.log(embeddings);
    // Upsert to Pinecone
    // const upserted = await pineconeService.upsertProducts(embeddings);
    // console.log(upserted);

    // Extract just the embedding vector from the first product
    const firstEmbedding = embeddings[0]?.embedding;
    let restrictedMatches;
    if (firstEmbedding) {
      restrictedMatches = await pineconeRestrictedService.queryRestrictedItems(firstEmbedding);
      console.log(restrictedMatches);
    }
    let analysis;
    if (restrictedMatches) {
      analysis = await openAIServiceScrapeRating.analyzeEmbeddingResponse(restrictedMatches);
    }
    console.log(analysis);


    return NextResponse.json({
      message: "Request processed successfully",
      data: products,
    });
  } catch (error) {
    console.error("Error scraping website:", error);
    return NextResponse.json(
      { error: "Error processing request" },
      { status: 500 }
    );
  }
}
