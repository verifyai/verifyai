import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Navigate to the page and wait for initial load
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Scroll to the bottom of the page to trigger lazy loading
    for (let i = 0; i < 2; i++) {
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve(true);
            }
          }, 100);
        });
      });
      // Wait a bit before the next scroll
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // Scroll back to the top of the page
    await page.evaluate(() => window.scrollTo(0, 0));

    // Wait for the content to load (use a broad selector or function for reliability)
    await page.waitForSelector('body', { timeout: 120000 });

    // Optional: Add an extra delay
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Take a full-page screenshot
    const screenshot = await page.screenshot({
      fullPage: true,
      encoding: 'base64',
    });

    // Get the HTML content of the page
    const htmlContent = await page.content();

    await browser.close();
    res.status(200).json({ screenshot, htmlContent });
  } catch (error) {
    console.error('Error scraping website:', error);
    res.status(500).json({ error: 'Error scraping website' });
  }
}
