import { Pinecone, PineconeRecord, RecordMetadata } from '@pinecone-database/pinecone';
import { Request, Response, NextFunction } from 'express';
import 'dotenv/config';

interface ProductMetadata extends RecordMetadata {
  name: string;
  price: string;
  imageUrl: string;
}

interface EmbeddingData {
  product: ProductMetadata;
  embedding: number[]; 
}

const pinecone = new Pinecone();
const index = pinecone.index<ProductMetadata>('products'); 

/**
 * Generate Pinecone records from embeddings data.
 */
const generatePineconeRecords = (
  embeddingsData: EmbeddingData[]
): PineconeRecord<ProductMetadata>[] => {
  return embeddingsData.map(({ product, embedding }) => ({
    id: `${product.name}-${product.price}-${product.imageUrl}`, 
    values: embedding,
    metadata: product, 
  }));
};

/**
 * Create batches of Pinecone records for upserting.
 */
const createPineconeBatches = (
  vectors: PineconeRecord<ProductMetadata>[],
  batchSize = 100
): PineconeRecord<ProductMetadata>[][] => {
  const batches: PineconeRecord<ProductMetadata>[][] = [];
  for (let i = 0; i < vectors.length; i += batchSize) {
    batches.push(vectors.slice(i, i + batchSize));
  }
  return batches;
};

/**
 * Upsert batches of Pinecone records to Pinecone.
 * Log the success or failure of each batch.
 */
const upsertBatchesToPinecone = async (
  pineconeBatches: PineconeRecord<ProductMetadata>[][]
): Promise<void> => {
  console.log(`Starting to upsert ${pineconeBatches.length} batches to Pinecone.`);

  const upsertResults = await Promise.allSettled(
    pineconeBatches.map(async (batch, i) => {
      console.log(`Upserting batch ${i + 1}/${pineconeBatches.length}`);
      return index.upsert(batch);
    })
  );

  upsertResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`Batch ${index + 1} upserted successfully.`);
    } else {
      console.error(`Failed to upsert batch ${index + 1}:`, result.reason);
    }
  });
};

/**
 * Middleware to handle Pinecone upsertion.
 */
export const upsertProductsToPinecone = async (
  req: Request,
  res: Response & { locals: { embeddingsData: EmbeddingData[] } },
  next: NextFunction
): Promise<void> => {
  try {
    const { embeddingsData } = res.locals;

    if (!embeddingsData || embeddingsData.length === 0) {
      console.error('No embeddings data found for upsertion.');
      res.status(400).json({ error: 'No embeddings data to upsert to Pinecone.' });
      return;
    }

    // Generate Pinecone records from the embeddings data
    const pineconeRecords = generatePineconeRecords(embeddingsData);

    // Create batches of records
    const pineconeBatches = createPineconeBatches(pineconeRecords);

    // Upsert batches to Pinecone
    await upsertBatchesToPinecone(pineconeBatches);

    console.log('Successfully upserted all products to Pinecone.');
    next();
  } catch (error) {
    console.error('Error upserting products to Pinecone:', error);
    res.status(500).json({ error: (error as Error).message });
  }
};
