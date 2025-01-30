import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { broadcastAlert } from '@/app/lib/eventEmitter';

export async function POST(req: Request) {
  const body = await req.json();
  const { url } = body;
  try {
    if (!url) {
      console.log('Error: No URL provided');
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    broadcastAlert({
      type: 'started',
      message: `Starting to scrape ${url}`,
      timestamp: Date.now(),
    });

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Navigate to the page and wait for initial load
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    broadcastAlert({
      type: 'pageLoaded',
      message: `Page loaded: ${url}`,
      timestamp: Date.now(),
    });

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

      broadcastAlert({
        type: 'scrolling',
        message: `Scrolling down iteration ${i + 1}`,
        timestamp: Date.now(),
      });

      // Wait a bit before the next scroll
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    broadcastAlert({
      type: 'scrollComplete',
      message: `Scrolling completed for ${url}`,
      timestamp: Date.now(),
    });

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

    broadcastAlert({
      type: 'screenshot',
      message: `Screenshot taken for ${url}`,
      timestamp: Date.now(),
    });

    // Create a directory for screenshots if it doesn't exist
    const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = Date.now();
    const filename = `screenshot-${timestamp}.png`;
    const filepath = path.join(screenshotsDir, filename);

    // Convert base64 to buffer and save
    const buffer = Buffer.from(screenshot, 'base64');
    fs.writeFileSync(filepath, buffer);

    await browser.close();

    broadcastAlert({
      type: 'completed',
      message: `Scraping completed for ${url}`,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      imageUrl:  `/screenshots/${filename}`,// URL path to access the image
    });
  } catch (error) {
    console.error('Error scraping website:', error);

    broadcastAlert({
      type: 'error',
      message: `Error scraping ${url}: ${
        error instanceof Error ? error.message : 'Error while sctraping website'
      }`,
      timestamp: Date.now(),
    });
    return NextResponse.json(
      { error: 'Error scraping website' },
      { status: 500 }
    );
  }
}
