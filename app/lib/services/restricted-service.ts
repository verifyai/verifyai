import OpenAI from 'openai';
import { Pinecone, PineconeRecord, RecordMetadata } from '@pinecone-database/pinecone';
import { Request, Response, NextFunction } from 'express';
import 'dotenv/config';
import { NextRequest } from "next/server";

interface RestrictedItem extends RecordMetadata {
  category: string;
  description: string;
  [key: string]: string; // Add index signature for string values
}

interface EmbeddingData {
  item: RestrictedItem;
  embedding: number[];
}

const pinecone = new Pinecone();
const restrictedIndex = pinecone.index<RestrictedItem>('restricted-items'); // Dedicated index for restricted items

class OpenAIServiceRestrictedItems {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Embed restricted items using OpenAI's embedding model.
   */
  async embedRestrictedItems(items: RestrictedItem[]): Promise<EmbeddingData[]> {
    const embeddingsData: EmbeddingData[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const inputText = `${item.category}: ${item.description}`;
        const response = await this.client.embeddings.create({
          model: 'text-embedding-ada-002', // OpenAI embedding model
          input: inputText,
        });

        const embedding = response.data[0]?.embedding;
        if (embedding) {
          embeddingsData.push({ item, embedding });
          console.log(`Generated embedding for restricted item ${i + 1}/${items.length}`);
        }
      } catch (error) {
        console.error(`Error embedding restricted item at index ${i}:`, error);
      }
    }

    return embeddingsData;
  }
}

/**
 * Generate Pinecone records from embeddings data for restricted items.
 */
const generateRestrictedPineconeRecords = (
  embeddingsData: EmbeddingData[]
): PineconeRecord<RestrictedItem>[] => {
  return embeddingsData.map(({ item, embedding }) => ({
    id: `${item.category}-${item.description}`, // Unique ID using category and description
    values: embedding,
    metadata: item,
  }));
};

/**
 * Create batches for upserting restricted items into Pinecone.
 */
const createPineconeBatches = (
  vectors: PineconeRecord<RestrictedItem>[],
  batchSize = 100
): PineconeRecord<RestrictedItem>[][] => {
  const batches: PineconeRecord<RestrictedItem>[][] = [];
  for (let i = 0; i < vectors.length; i += batchSize) {
    batches.push(vectors.slice(i, i + batchSize));
  }
  return batches;
};

/**
 * Upsert batches of Pinecone records to the restricted items index.
 */
const upsertBatchesToPinecone = async (
  pineconeBatches: PineconeRecord<RestrictedItem>[][],
  index: ReturnType<typeof pinecone.index>
): Promise<void> => {
  console.log(`Starting to upsert ${pineconeBatches.length} batches of restricted items.`);

  const upsertResults = await Promise.allSettled(
    pineconeBatches.map(async (batch, i) => {
      console.log(`Upserting restricted batch ${i + 1}/${pineconeBatches.length}`);
      return index.upsert(batch);
    })
  );

  upsertResults.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      console.log(`Batch ${i + 1} upserted successfully.`);
    } else {
      console.error(`Failed to upsert batch ${i + 1}:`, result.reason);
    }
  });
};

/**
 * Combined middleware to process restricted items.
 */
export const processRestrictedItems = async (req: NextRequest) => {
  const restrictedItems = [
    { category: 'Drugs', description: 'Drugs and drug paraphernalia' },
    { category: 'Marijuana', description: 'Marijuana dispensaries and related products' },
    { category: 'Weapons', description: 'Weapons, munitions, gunpowder, and explosives' },
    { category: 'Toxic Materials', description: 'Toxic, flammable, and radioactive materials' },
    { category: 'Pseudo-Pharmaceuticals', description: 'Products mimicking drugs or pharmaceuticals' },
    { category: 'Explicit Content', description: 'Sexually explicit content and services' },
    { category: 'Pyramid Schemes', description: 'Unfair, predatory, or deceptive practices' },
    { category: 'Speculative Items', description: 'Items used for speculation or hedging' },
    { category: 'Gambling', description: 'Casino games, sports betting, and lotteries' },
    { category: 'Cryptocurrencies', description: 'Sale or trade of cryptocurrencies' },
    // Add other restricted items or businesses as needed
  ];

  try {
    const openAIService = new OpenAIServiceRestrictedItems();

    // Generate embeddings for restricted items
    const embeddingsData = await openAIService.embedRestrictedItems(restrictedItems);

    if (!embeddingsData || embeddingsData.length === 0) {
      throw new Error('No embeddings were generated for restricted items.');
    }

    // Generate Pinecone records
    const pineconeRecords = generateRestrictedPineconeRecords(embeddingsData);

    // Batch and upsert into Pinecone
    const batches = createPineconeBatches(pineconeRecords);
    await upsertBatchesToPinecone(batches, restrictedIndex);

    console.log('Restricted items processed successfully.');
    return restrictedItems;
  } catch (error) {
    console.error('Error processing restricted items:', error);
    return { error: (error as Error).message };
  }
};

export const restrictedService = {
  processRestrictedItems
};