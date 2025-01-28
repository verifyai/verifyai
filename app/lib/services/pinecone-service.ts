import { Pinecone, PineconeRecord, RecordMetadata } from '@pinecone-database/pinecone';

interface ProductMetadata extends RecordMetadata {
  name: string;
  price: string;
  imageUrl: string;
}

interface EmbeddingData {
  product: ProductMetadata;
  embedding: number[];
}

export class PineconeService {
  private pinecone: Pinecone;
  private index: ReturnType<Pinecone['index']>;

  constructor() {
    this.pinecone = new Pinecone();
    this.index = this.pinecone.index<ProductMetadata>('products');
  }

  private generatePineconeRecords(
    embeddingsData: EmbeddingData[]
  ): PineconeRecord<ProductMetadata>[] {
    return embeddingsData.map(({ product, embedding }) => ({
      id: `${product.name}-${product.price}-${product.imageUrl}`,
      values: embedding,
      metadata: product,
    }));
  }

  private createBatches(
    vectors: PineconeRecord<ProductMetadata>[],
    batchSize = 100
  ): PineconeRecord<ProductMetadata>[][] {
    const batches: PineconeRecord<ProductMetadata>[][] = [];
    for (let i = 0; i < vectors.length; i += batchSize) {
      batches.push(vectors.slice(i, i + batchSize));
    }
    return batches;
  }

  async upsertProducts(embeddingsData: EmbeddingData[]): Promise<void> {
    if (!embeddingsData?.length) {
      throw new Error('No embeddings data to upsert to Pinecone.');
    }

    const pineconeRecords = this.generatePineconeRecords(embeddingsData);
    const batches = this.createBatches(pineconeRecords);

    console.log(`Starting to upsert ${batches.length} batches to Pinecone.`);

    const results = await Promise.allSettled(
      batches.map(async (batch, i) => {
        console.log(`Upserting batch ${i + 1}/${batches.length}`);
        return this.index.upsert(batch);
      })
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Batch ${index + 1} upserted successfully.`);
      } else {
        console.error(`Failed to upsert batch ${index + 1}:`, result.reason);
      }
    });
  }
}

export const pineconeService = new PineconeService(); 