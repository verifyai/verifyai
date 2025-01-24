import * as cheerio from 'cheerio';
import axios from 'axios';
import { Request, Response, NextFunction } from 'express';

interface ScrapedData {
  url: string;
  links: string[];
}

interface ResponseLocals {
  scrapedData: ScrapedData;
  analysis: string;
}

const scrape = async (req: Request, res: Response & { locals: ResponseLocals }, next: NextFunction): Promise<void> => {
  try {
    // Get the request body
    const { url } = req.body;

    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    // Fetch the HTML content
    const response = await axios.get(url);
    const html = response.data;

    // Load HTML into cheerio
    const $ = cheerio.load(html);

    // Initialize sitemap array
    const sitemap = new Set<string>();

    // Find all links
    $('a').each((i, link) => {
      const href = $(link).attr('href');
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

    // Store the scraping result in the response object
    res.locals.scrapedData = {
      url,
      links: Array.from(sitemap),
    };

    // Continue to the next middleware/route handler
    next();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export { scrape };
export type { ScrapedData, ResponseLocals };
