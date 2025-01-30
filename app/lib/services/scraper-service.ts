import puppeteer, { type Page } from "puppeteer";
import { ProductData } from "@/app/lib/types/product";

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

  private async bypassPopups(page: Page): Promise<void> {
    try {
      // Handle Age Verification Popup
      const hasYesButton = await page.evaluate(() => {
        const button = document.evaluate(
          "//button[contains(text(), 'YES')]",
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue as HTMLElement;
        if (button) button.click();
        return !!button;
      });
      if (hasYesButton) {
        await page.waitForFunction('setTimeout(() => true, 2000)');
      }

      // Handle Location Permission Popup
      const hasAllowButton = await page.evaluate(() => {
        const button = document.evaluate(
          "//button[contains(text(), 'Allow while visiting the site')]",
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue as HTMLElement;
        if (button) button.click();
        return !!button;
      });
      if (hasAllowButton) {
        await page.waitForFunction('setTimeout(() => true, 2000)');
      }
    } catch (error) {
      console.error("Error handling popups:", error);
    }
  }

  private cleanText(text: string): string {
    return text.replace(/\s+/g, " ").replace(/\\n/g, "").trim();
  }

  async scrapeProducts(url: string): Promise<ProductData[]> {
    const browser = await puppeteer.launch({
      headless: false,  
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled", 
      ],
      defaultViewport: null,
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    try {
      await page.goto(url, { waitUntil: "networkidle2" });

      // Attempt to bypass popups
      await this.bypassPopups(page);

      await this.autoScroll(page);

      const products = await page.evaluate(() => {
        const productElements = document.querySelectorAll(
          '.product, .item, .product-container, [class*="product"], [class*="item"]'
        );
        const excludeKeywords = [
          "login",
          "sign up",
          "logout",
          "terms",
          "privacy",
          "careers",
          "contact",
          "gift card",
          "faq",
          "warranty",
        ];

        const productData: { name: string; price: string; imageUrl: string }[] =
          [];

        productElements.forEach((product) => {
          const name =
            product
              .querySelector('[class*="name"], [class*="title"], h2, h3')
              ?.textContent?.trim()
              .toLowerCase() || "";
          const price =
            product
              .querySelector('[class*="price"], .amount, [data-price]')
              ?.textContent?.trim()
              .toLowerCase() || "";
          const imageUrl =
            product.querySelector("img")?.getAttribute("src") ||
            product.querySelector("img")?.getAttribute("data-src") ||
            product.querySelector("img")?.getAttribute("data-lazy-src") ||
            "";

          if (
            !excludeKeywords.some((keyword) => name.includes(keyword)) &&
            name &&
            price &&
            imageUrl
          ) {
            productData.push({ name, price, imageUrl });
          }
        });

        return Array.from(
          new Map(
            productData.map((item) => [
              `${item.name}|${item.price}|${item.imageUrl}`,
              item,
            ])
          ).values()
        );
      });

      if (!products.length) {
        throw new Error("No products found.");
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

  async getScreenshot(
    url: string
  ): Promise<{ screenshot: string; htmlContent: string }> {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

      // Attempt to bypass popups
      await this.bypassPopups(page);

      await this.autoScroll(page);

      const screenshot = await page.screenshot({
        fullPage: true,
        encoding: "base64",
      });

      const htmlContent = await page.content();

      return { screenshot, htmlContent };
    } finally {
      await browser.close();
    }
  }
}

export const scraperService = new ScraperService();
