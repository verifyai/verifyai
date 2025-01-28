import puppeteer, { type Page } from 'puppeteer';
import { Request, Response } from 'express';

interface ScrapedProduct {
  name: string;
  price: string;
  imageUrl: string;
}

// Auto-scroll function
async function autoScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// Function to clean text data
function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/\\n/g, '').trim();
}

// Scraper function
async function scrapeProductData(url: string): Promise<ScrapedProduct[]> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Scroll to load dynamic content
    await autoScroll(page);

    // Evaluate and scrape data
    const products: ScrapedProduct[] = await page.evaluate(() => {
      const productElements = document.querySelectorAll('.product, .item, .product-container, [class*="product"], [class*="item"]');
      const excludeKeywords = ['login', 'sign up', 'logout', 'terms', 'privacy', 'careers', 'contact', 'gift card', 'faq', 'warranty'];

      const productData: { name: string; price: string; imageUrl: string }[] = [];

      productElements.forEach((product) => {
        const name = product.querySelector('[class*="name"], [class*="title"], h2, h3')?.textContent?.trim().toLowerCase() || '';
        const price = product.querySelector('[class*="price"], .amount, [data-price]')?.textContent?.trim().toLowerCase() || '';
        const imageUrl =
          product.querySelector('img')?.getAttribute('src') ||
          product.querySelector('img')?.getAttribute('data-src') ||
          product.querySelector('img')?.getAttribute('data-lazy-src') ||
          '';

        // Skip unwanted products
        if (!excludeKeywords.some((keyword) => name.includes(keyword)) && name && price && imageUrl) {
          productData.push({ name, price, imageUrl });
        }
      });

      // De-duplicate products
      const uniqueProducts = Array.from(new Map(productData.map((item) => [`${item.name}|${item.price}|${item.imageUrl}`, item])).values());

      return uniqueProducts;
    });

    if (!products.length) {
      throw new Error('No products found.');
    }

    // Clean final data
    return products.map((product) => ({
      name: cleanText(product.name),
      price: cleanText(product.price),
      imageUrl: product.imageUrl,
    }));
  } catch (error) {
    console.error('An error occurred while scraping:', error);
    return [];
  } finally {
    await browser.close();
  }
}

// Middleware function for API call
export async function scrapeProduct(
  req: Request<{ url?: string }>,
  res: Response
): Promise<void> {
  const { url } = req.query;

  if (typeof url !== 'string') {
    res.status(400).json({ error: 'Please provide a valid URL to scrape.' });
    return;
  }

  try {
    const data = await scrapeProductData(url);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error in scraping middleware:', error);
    res.status(500).json({ success: false, error: 'Failed to scrape the data.' });
  }
}
