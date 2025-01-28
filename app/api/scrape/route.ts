import { NextResponse } from "next/server";
import { scraperService } from "@/app/lib/services/scraper-service";
import { openAIService } from "@/app/lib/services/openai-service";
import { pineconeService } from "@/app/lib/services/pinecone-service";
import { pineconeRestrictedService } from "@/app/lib/services/pineconeQuery-service";
export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    console.log("Scraping URL:", url);
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Scrape products
    const products = await scraperService.scrapeProducts(url);
    console.log("Scraped products:", products);
    // Generate embeddings
    const embeddings = await openAIService.embedProducts(products);
    console.log("Generated embeddings:", embeddings);
    // Upsert to Pinecone
    await pineconeService.upsertProducts(embeddings);
    console.log("Upserted to Pinecone");

    // Extract just the embedding vector from the first product
    const firstEmbedding = embeddings[0]?.embedding;
    if (firstEmbedding) {
      const restrictedMatches = await pineconeRestrictedService.queryRestrictedItems(firstEmbedding);
      console.log("Checked against restricted items:", restrictedMatches);
    }

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
