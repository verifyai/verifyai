import { RecordMetadata } from "@pinecone-database/pinecone";

export interface ProductData extends RecordMetadata {
  name: string;
  price: string;
  imageUrl: string;
  [key: string]: string;
}

export interface ProductEmbedding {
  index: number;
  product: ProductData;
  embedding: number[];
} 