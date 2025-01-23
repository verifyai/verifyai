import puppeteer, { type Page, type Browser } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

// Set of visited URLs to prevent re-crawling
const visitedUrls = new Set<string>();

// Keywords to skip in URLs
const skipKeywords = [
  'login',
  'signup',
  'logout',
  'terms',
  'privacy',
  'faq',
  'contact',
  'gift-card',
  'work-with-us',
  'careers',
  'warranty',
  'returns',
  'about',
  'policy',
];

// Auto-scroll function to load dynamic content
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

// Extract all internal links from a page
async function extractLinks(page: Page, baseUrl: string): Promise<string[]> {
  const links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    return anchors.map((a) => (a as HTMLAnchorElement).href);
  });

  const baseDomain = new URL(baseUrl).origin;
  return links
    .filter((link) => link.startsWith(baseDomain)) // Internal links only
    .filter((link) => !skipKeywords.some((keyword) => link.includes(keyword))); // Skip unwanted links
}

// Scrape product data from the page
async function scrapeProductData(page: Page): Promise<any[]> {
  return await page.evaluate(() => {
    const productElements = document.querySelectorAll('.product-card'); // Adjust selector as needed

    if (!productElements) return [];

    const productData: any[] = [];
    productElements.forEach((product) => {
      const name = product.querySelector('.product-card__title')?.textContent?.trim() || '';
      const price = product.querySelector('.product-card__price')?.textContent?.trim() || '';
      const imageUrl = product.querySelector('img')?.src || '';

      if (name && price && imageUrl) {
        productData.push({ name, price, imageUrl });
      }
    });

    return productData;
  });
}

// Retry logic for handling transient errors
async function withRetry<T>(fn: () => Promise<T>, retries: number = 3): Promise<T | null> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (error instanceof Error) {
        console.warn(`Retrying (${attempt}/${retries}) due to error:`, error.message);
      } else {
        console.warn(`Retrying (${attempt}/${retries})`);
      }
    }
  }
  console.error('Failed after maximum retries.');
  return null;
}

// Recursive crawling and scraping function
async function crawlAndScrape(
  browser: Browser,
  currentUrl: string,
  baseUrl: string,
  depth: number = 0,
  maxDepth: number = 3
): Promise<any[]> {
  if (visitedUrls.has(currentUrl) || depth > maxDepth) return [];
  visitedUrls.add(currentUrl);

  console.log(`Crawling: ${currentUrl}`);

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(120000);
  page.setDefaultTimeout(120000);

  try {
    const response = await withRetry(() => page.goto(currentUrl, { waitUntil: 'networkidle2', timeout: 120000 }));
    if (!response) {
      console.warn(`Skipping URL after failed retries: ${currentUrl}`);
      await page.close();
      return [];
    }

    await autoScroll(page);

    const products = await scrapeProductData(page);

    const links = await extractLinks(page, baseUrl);

    await page.close();

    const results = await Promise.all(
      links.map((link) => crawlAndScrape(browser, link, baseUrl, depth + 1, maxDepth))
    );

    return [...products, ...results.flat()];
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to crawl: ${currentUrl}`, error.message);
    }
    await page.close();
    return [];
  }
}

// Main scraper function
async function startScraper(initialUrl: string): Promise<void> {
  const browser = await puppeteer.launch({ headless: true });

  try {
    const baseUrl = new URL(initialUrl).origin;

    const products = await crawlAndScrape(browser, initialUrl, baseUrl);

    const outputDir = path.resolve(__dirname, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const jsonFilePath = path.join(outputDir, 'products.json');
    fs.writeFileSync(jsonFilePath, JSON.stringify(products, null, 2));

    console.log('\n=== Scraped Product Data ===');
    console.table(products);
    console.log(`\nProduct data saved to ${jsonFilePath}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error('An error occurred:', error.message);
    } else {
      console.error('An unknown error occurred');
    }
  } finally {
    await browser.close();
  }
}

// Command-line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const initialUrl = args[0];

  if (!initialUrl) {
    console.error('Please provide a URL to scrape.');
    console.log('Usage: ts-node scraping-tool.ts <url>');
    process.exit(1);
  }

  console.log(`Starting scraper for URL: ${initialUrl}`);
  startScraper(initialUrl).then(() => {
    console.log('Scraping completed!');
  });
}
