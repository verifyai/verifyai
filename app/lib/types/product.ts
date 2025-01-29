import { RecordMetadata } from "@pinecone-database/pinecone";
import { RestrictedItemData } from "./restricted";

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

export interface ScrapeRating {
  score: number;
  metadata: RestrictedItemData;
}