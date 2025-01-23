import puppeteer, { type Page } from 'puppeteer';
const fs = require('fs');
const path = require('path');

// Auto-scroll function
async function autoScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 100; // Scroll distance
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100); // Scroll every 100ms
    });
  });
}

// Scraper function
async function scrapeProductData(url: string): Promise<any[]> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to the given URL
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Scroll to load dynamic content
    await autoScroll(page);

    // Select potential product containers dynamically
    const products = await page.evaluate(() => {
      const possibleContainers = [
        '.product',
        '.item',
        '.product-container',
        '[class*="product"]',
        '[class*="item"]',
      ];

      let productElements: NodeListOf<Element> | null = null;

      for (const selector of possibleContainers) {
        productElements = document.querySelectorAll(selector);
        if (productElements.length > 0) break;
      }

      if (!productElements) return [];

      const productData: any[] = [];
      productElements.forEach((product) => {
        const name =
          product.querySelector('[class*="name"], [class*="title"], h2, h3')?.textContent?.trim() ||
          '';
        const price =
          product.querySelector('[class*="price"], .amount, [data-price]')?.textContent?.trim() ||
          '';
        const imageUrl = (product.querySelector('img') as HTMLImageElement)?.src || '';

        productData.push({
          name,
          price,
          imageUrl,
        });
      });

      return productData;
    });

    if (!products.length) {
      console.log('No products found. Check the selectors or debug the page.');
    }

    // Save data and take screenshots
    const outputDir = path.resolve(__dirname, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const jsonFilePath = path.join(outputDir, 'products.json');
    fs.writeFileSync(jsonFilePath, JSON.stringify(products, null, 2));

    console.log('\n=== Scraped Product Data ===');
    console.table(products);
    console.log(`\nProduct data saved to ${jsonFilePath}`);

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      if (product.imageUrl) {
        const screenshotPath = path.join(outputDir, `product_${i + 1}.png`);
        await takeScreenshot(page, product.imageUrl, screenshotPath);
        console.log(`Screenshot saved to ${screenshotPath}`);
      }
    }

    return products;
  } catch (error) {
    console.error('An error occurred while scraping:', error);
    return [];
  } finally {
    await browser.close();
  }
}

// Screenshot function
async function takeScreenshot(page: Page, imageUrl: string, filePath: string): Promise<void> {
  try {
    await page.goto(imageUrl, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: filePath });
  } catch (error) {
    console.error('Error taking screenshot:', error);
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
  scrapeProductData(url).then(() => {
    console.log('Scraping completed!');
  });
}
