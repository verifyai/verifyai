"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
const fs = require('fs');
const path = require('path');
// Auto-scroll function
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
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
async function scrapeProductData(url) {
    const browser = await puppeteer_1.default.launch({ headless: true });
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
            let productElements = null;
            for (const selector of possibleContainers) {
                productElements = document.querySelectorAll(selector);
                if (productElements.length > 0)
                    break;
            }
            if (!productElements)
                return [];
            const productData = [];
            productElements.forEach((product) => {
                var _a, _b, _c, _d, _e;
                const name = ((_b = (_a = product.querySelector('[class*="name"], [class*="title"], h2, h3')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim()) ||
                    '';
                const price = ((_d = (_c = product.querySelector('[class*="price"], .amount, [data-price]')) === null || _c === void 0 ? void 0 : _c.textContent) === null || _d === void 0 ? void 0 : _d.trim()) ||
                    '';
                const imageUrl = ((_e = product.querySelector('img')) === null || _e === void 0 ? void 0 : _e.src) || '';
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
        if (!fs.existsSync(outputDir))
            fs.mkdirSync(outputDir);
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
    }
    catch (error) {
        console.error('An error occurred while scraping:', error);
        return [];
    }
    finally {
        await browser.close();
    }
}
// Screenshot function
async function takeScreenshot(page, imageUrl, filePath) {
    try {
        await page.goto(imageUrl, { waitUntil: 'networkidle2' });
        await page.screenshot({ path: filePath });
    }
    catch (error) {
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
