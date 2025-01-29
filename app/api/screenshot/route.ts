import type { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

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
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForSelector("body", { timeout: 120000 });
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const screenshot = await page.screenshot({
      fullPage: true,
      encoding: "base64",
    });

    const htmlContent = await page.content();
    await browser.close();

    res.status(200).json({ screenshot, htmlContent });
  } catch (error) {
    console.error("Error capturing screenshot:", error);
    res.status(500).json({ error: "Error capturing screenshot" });
  }
}
