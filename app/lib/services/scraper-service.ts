import puppeteer, { type Page } from 'puppeteer';
import { ProductData } from "@/app/lib/types/product";

interface ScrapedProduct extends ProductData {
  name: string;
  price: string;
  imageUrl: string;
  [key: string]: string;  // Add index signature
}

export class ScraperService {
  private async autoScroll(page: Page): Promise<void> {
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

  private cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').replace(/\\n/g, '').trim();
  }

  async scrapeProducts(url: string): Promise<ProductData[]> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      await this.autoScroll(page);

      const products = await page.evaluate(() => {
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

          if (!excludeKeywords.some((keyword) => name.includes(keyword)) && name && price && imageUrl) {
            productData.push({ name, price, imageUrl });
          }
        });

        return Array.from(new Map(productData.map((item) => [`${item.name}|${item.price}|${item.imageUrl}`, item])).values());
      });

      if (!products.length) {
        throw new Error('No products found.');
      }

      return products.map((product) => ({
        name: this.cleanText(product.name),
        price: this.cleanText(product.price),
        imageUrl: product.imageUrl,
      }));
    } finally {
      await browser.close();
    }
  }

  async getScreenshot(url: string): Promise<{ screenshot: string; htmlContent: string }> {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await this.autoScroll(page);

      const screenshot = await page.screenshot({
        fullPage: true,
        encoding: 'base64',
      });

      const htmlContent = await page.content();

      return { screenshot, htmlContent };
    } finally {
      await browser.close();
    }
  }
}

export const scraperService = new ScraperService(); 