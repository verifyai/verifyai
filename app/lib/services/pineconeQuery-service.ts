import { Pinecone } from "@pinecone-database/pinecone";
import { Request, Response, NextFunction } from "express";
import "dotenv/config";
import { RestrictedItemEmbedding, RestrictedItemData } from "../types/restricted";

export class PineconeRestrictedService {
  private pinecone: Pinecone;
  private index: ReturnType<Pinecone["index"]>;

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY as string,
    });
    this.index = this.pinecone.index<RestrictedItemData>("restricted-items"); // Name of the Pinecone index for restricted items
  }

  async queryRestrictedItems(
    embedding: number[],
    topK = 20
  ): Promise<{ score: number; metadata: RestrictedItemData }[]> {
    try {
      const queryResponse = await this.index.query({
        vector: embedding,
        topK,
        includeValues: false,
        includeMetadata: true,
      });

      return queryResponse.matches
        .filter((match): match is typeof match & { score: number; metadata: RestrictedItemData } => 
          match.score !== undefined && match.metadata !== undefined
        )
        .map(({ score, metadata }) => ({
          score,
          metadata,
        }));
    } catch (error) {
      console.error("Error querying Pinecone for restricted items:", error);
      throw new Error("Failed to query Pinecone for restricted items.");
    }
  }

  /**
   * Middleware to query Pinecone for restricted items.
   */
  async queryRestrictedItemsMiddleware(
    req: Request,
    res: Response & { locals: { embeddingsData: RestrictedItemEmbedding[]; restrictedEmbedding: number[] } },
    next: NextFunction
  ): Promise<void> {
    try {
      const { restrictedEmbedding } = res.locals;

      if (!restrictedEmbedding || !Array.isArray(restrictedEmbedding)) {
        console.error("No valid restricted embedding found.");
        res
          .status(400)
          .json({ error: "No valid restricted embedding provided for querying." });
        return;
      }

      // Query Pinecone with the provided embedding
      const queryResults = await this.queryRestrictedItems(restrictedEmbedding);

      res.locals.restrictedQueryResults = queryResults;
      next();
    } catch (error) {
      console.error("Error querying restricted items in Pinecone:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
}

export const pineconeRestrictedService = new PineconeRestrictedService();
