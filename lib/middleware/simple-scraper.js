import * as cheerio from 'cheerio';
import axios from 'axios';

const scrape = async (req, res, next) => {
  try {
    // Get the request body
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Fetch the HTML content
    const response = await axios.get(url);
    const html = response.data;

    // Load HTML into cheerio
    const $ = cheerio.load(html);

    // Initialize sitemap array
    const sitemap = new Set();

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
        } catch (e) {
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
    res.status(500).json({ error: error.message });
  }
};

export { scrape };
