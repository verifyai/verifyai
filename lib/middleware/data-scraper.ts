import puppeteer, { type Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

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

// Function to clean data
function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/\\n/g, '').trim();
}

// Scraper function
async function scrapeProductData(url: string): Promise<any[]> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Scroll to load dynamic content
    await autoScroll(page);

    // Evaluate and scrape data
    const products = await page.evaluate(() => {
      const productElements = document.querySelectorAll('.product, .item, .product-container, [class*="product"], [class*="item"]');
      const excludeKeywords = ['login', 'sign up', 'logout', 'terms', 'privacy', 'careers', 'contact', 'gift card', 'faq', 'warranty'];

      const productData: any[] = [];

      productElements.forEach((product) => {
        let name = product.querySelector('[class*="name"], [class*="title"], h2, h3')?.textContent || '';
        let price = product.querySelector('[class*="price"], .amount, [data-price]')?.textContent || '';
        let imageUrl =
          product.querySelector('img')?.getAttribute('src') ||
          product.querySelector('img')?.getAttribute('data-src') ||
          product.querySelector('img')?.getAttribute('data-lazy-src') ||
          '';

        // Clean data
        name = name.trim().toLowerCase();
        price = price.trim().toLowerCase();

        // Skip unwanted products
        if (excludeKeywords.some((keyword) => name.includes(keyword))) return;

        // Add to product data if valid
        if (name && price && imageUrl) {
          productData.push({ name, price, imageUrl });
        }
      });

      // De-duplicate products
      const uniqueProducts = new Map();
      productData.forEach((product) => {
        const key = `${product.name}|${product.price}|${product.imageUrl}`;
        if (!uniqueProducts.has(key)) {
          uniqueProducts.set(key, product);
        }
      });

      return Array.from(uniqueProducts.values());
    });

    // Retry failed crawls
    if (!products.length) throw new Error('No products found. Retrying...');

    // Clean final data
    const cleanedProducts = products.map((product) => ({
      name: cleanText(product.name),
      price: cleanText(product.price),
      imageUrl: product.imageUrl,
    }));

    // Save data
    const outputDir = path.resolve(__dirname, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const jsonFilePath = path.join(outputDir, 'products_cleaned.json');
    fs.writeFileSync(jsonFilePath, JSON.stringify(cleanedProducts, null, 2));

    console.log('\n=== Scraped Product Data ===');
    console.table(cleanedProducts);
    console.log(`\nProduct data saved to ${jsonFilePath}`);

    return cleanedProducts;
  } catch (error) {
    console.error('An error occurred while scraping:', error);
    return [];
  } finally {
    await browser.close();
  }
}

// Command-line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const url = args[0];

  if (!url) {
    console.error('Please provide a URL to scrape.');
    console.log('Usage: ts-node scraping-tool.ts <url>');
    process.exit(1);
  }

  console.log(`Starting scraper for URL: ${url}`);
  scrapeProductData(url)
    .then(() => {
      console.log('Scraping completed!');
    })
    .catch((error) => {
      console.error('Scraping failed:', error);
    });
}
