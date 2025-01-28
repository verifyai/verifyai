import OpenAI from "openai";
import { Request, Response, NextFunction } from "express";

interface URLAnalysis {
  homepage: string;
  product: string;
  checkout: string;
  suspicious: string;
}

interface ProductData {
  name: string;
  price: string;
  imageUrl: string;
}

interface ProductEmbedding {
  index: number;
  product: ProductData;
  embedding: number[];
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
      console.log("Analyzing URLs with OpenAI:", urls.join(", "));
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
        console.log(`Generated embedding ${i + 1}/${products.length}`);
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

// Export a singleton instance
export const openAIService = new OpenAIService();
