import * as cheerio from "cheerio";
import axios from "axios";

export interface ScrapedData {
  url: string;
  links: string[];
}

export class SitemapService {
  async scrapeUrl(url: string): Promise<ScrapedData> {
    if (!url) {
      throw new Error("URL is required");
    }

    try {
      // Fetch the HTML content
      const response = await axios.get(url);
      const html = response.data;

      // Load HTML into cheerio
      const $ = cheerio.load(html);

      // Initialize sitemap array
      const sitemap = new Set<string>();

      // Find all links
      $("a").each((i, link) => {
        const href = $(link).attr("href");
        if (href) {
          try {
            // Convert relative URLs to absolute
            const absoluteUrl = new URL(href, url).href;
            // Only include URLs from the same domain
            if (absoluteUrl.startsWith(url)) {
              sitemap.add(absoluteUrl);
            }
          } catch {
            // Skip invalid URLs
            console.log(`Skipping invalid URL: ${href}`);
          }
        }
      });

      return {
        url,
        links: Array.from(sitemap),
      };
    } catch (error) {
      throw new Error(
        `Failed to scrape URL: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

// Export a singleton instance
export const sitemapService = new SitemapService();
