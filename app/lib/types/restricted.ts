import { RecordMetadata } from "@pinecone-database/pinecone";

export interface RestrictedItemData extends RecordMetadata {
  category: string;
  description: string;
  [key: string]: string;
}

export interface RestrictedItemEmbedding {
  item: RestrictedItemData;
  embedding: number[];
} 