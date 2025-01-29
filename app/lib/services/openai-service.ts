import OpenAI from "openai";
import { Request, Response, NextFunction } from "express";
import { pineconeRestrictedService } from "./pineconeQuery-service";
import { ProductData, ProductEmbedding } from "../types/product";
import { RestrictedItemData } from "../types/restricted";

interface URLAnalysis {
  homepage: string;
  product: string;
  checkout: string;
  suspicious: string;
}

interface ScrapedDataProduct {
  cleanedProducts: ProductData[];
}

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async determineTargetURLs(urls: string[]): Promise<URLAnalysis> {
    const systemPrompt = `You are a URL analysis expert. From the provided list of URLs,
            identify exactly 4 URLs that represent:
            1. The website's homepage
            2. A product page
            3. A checkout page
            4. Any page that appears suspicious or potentially malicious

            Return the results in this exact JSON format:
            {
              "homepage": "url1",
              "product": "url2",
              "checkout": "url3",
              "suspicious": "url4"
            }
            Provide only the JSON object, no additional explanation.`;

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Please analyze these URLs: ${urls.join(", ")}`,
          },
        ],
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content returned from OpenAI");
      }
      return JSON.parse(content);
    } catch (error) {
      console.error("Error in OpenAI API call:", error);
      throw new Error("Failed to analyze URLs with OpenAI");
    }
  }

  async embedProducts(products: ProductData[]): Promise<ProductEmbedding[]> {
    const embeddingsData: ProductEmbedding[] = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      try {
        const inputText = `${product.name} - ${product.price}`;
        const response = await this.client.embeddings.create({
          model: "text-embedding-ada-002",
          input: inputText,
        });

        const embedding = response.data[0]?.embedding;
        if (embedding) {
          embeddingsData.push({
            index: i,
            product,
            embedding,
          });
        }
      } catch (error) {
        console.error(`Error embedding product at index ${i}:`, error);
      }
    }

    return embeddingsData;
  }
}

// Add the middleware at the end of the file, before the singleton export
export const analyzeProduct = async (
  req: Request,
  res: Response & {
    locals: { scrapedData: ScrapedDataProduct; analysis: ProductEmbedding[] };
  },
  next: NextFunction
): Promise<void> => {
  try {
    const { cleanedProducts } = res.locals.scrapedData;

    if (!cleanedProducts || !Array.isArray(cleanedProducts)) {
      throw new Error("Invalid or missing product data.");
    }

    const analysis = await openAIService.embedProducts(cleanedProducts);

    res.locals.analysis = analysis;
    next();
  } catch (error) {
    console.error("Error analyzing products:", error);
    res.status(500).json({ error: (error as Error).message });
  }
};


/*
========================================
            Scrape Rating
========================================  
*/
export class OpenAIServiceScrapeRating {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }


async analyzeEmbeddingResponse(restrictedMatches: { score: number; metadata: RestrictedItemData }[]): Promise<any> {

  if (!restrictedMatches || restrictedMatches.length === 0) {
    throw new Error("No restricted matches found.");
  }

  const systemPrompt = `You are an AI designed to return JSON output only. 
  Analyze the given restricted matches and return a risk assessment.

  **STRICTLY FOLLOW THIS FORMAT:**
  {
    "score": 1,
    "metadata": {
      "restrictedItems": 1,
      "productPages": 1,
      "ownership": 1,
      "overallSafety": 1
    }
  }

   Give a rating of 1-10 with 10 being the safest for ownership, lack of restricted items, and product pages, with an overall safety for all three as the fourth metric. 
   The restrictedMatches score is a return from a vector database based on comparison between scraped data embeddings and prohibited items embeddings.
   Consider the restrictedMatches scores as a metric for the safety of the provided categories with the score representing 0 as a 1-1 return of 100% presents restricted items and 1 being a 0-1 return of 0% presents no restricted items whatsoever.
   Anything above a restrictedMatches score of .75 is considered a perfect score with an output of 10. 

   Example: 
    {
    score: 0.715159714,
    metadata: {
      category: 'Gambling',
      description: 'Casino games, sports betting, and lotteries'
    }
  },
  Expected Output: 
   "score": 9,
    "metadata": {
      "restrictedItems": 9,
      "productPages": 9,
      "ownership": 9,
      "overallSafety": 9
    }

  DO NOT include any explanations, extra text, or commentary. ONLY return a JSON object exactly in the specified format.`;

  try {
    const response = await this.client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Here are the restricted matches: ${JSON.stringify(restrictedMatches)}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    // Force parsing as JSON
    try {
      const parsedResponse = JSON.parse(content);
      return parsedResponse;
    } catch (error) {
      console.error("Failed to parse OpenAI response:", error);
      throw new Error("OpenAI response was not valid JSON.");
    }
  } catch (error) {
    console.error("Error analyzing embedding response:", error);
    throw error;
  }
}
}

// Export a singleton instance
export const openAIService = new OpenAIService();

// At the bottom of the file, add:
export const openAIServiceScrapeRating = new OpenAIServiceScrapeRating();
