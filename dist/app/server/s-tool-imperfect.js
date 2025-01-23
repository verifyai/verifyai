"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Set of visited URLs to prevent re-crawling
const visitedUrls = new Set();
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
async function autoScroll(page) {
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
                    resolve();
                }
            }, 100);
        });
    });
}
// Extract all internal links from a page
async function extractLinks(page, baseUrl) {
    const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        return anchors.map((a) => a.href);
    });
    const baseDomain = new URL(baseUrl).origin;
    return links
        .filter((link) => link.startsWith(baseDomain)) // Internal links only
        .filter((link) => !skipKeywords.some((keyword) => link.includes(keyword))); // Skip unwanted links
}
// Scrape product data from the page
async function scrapeProductData(page) {
    return await page.evaluate(() => {
        const productElements = document.querySelectorAll('.product-card'); // Adjust selector as needed
        if (!productElements)
            return [];
        const productData = [];
        productElements.forEach((product) => {
            var _a, _b, _c, _d, _e;
            const name = ((_b = (_a = product.querySelector('.product-card__title')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || '';
            const price = ((_d = (_c = product.querySelector('.product-card__price')) === null || _c === void 0 ? void 0 : _c.textContent) === null || _d === void 0 ? void 0 : _d.trim()) || '';
            const imageUrl = ((_e = product.querySelector('img')) === null || _e === void 0 ? void 0 : _e.src) || '';
            if (name && price && imageUrl) {
                productData.push({ name, price, imageUrl });
            }
        });
        return productData;
    });
}
// Retry logic for handling transient errors
async function withRetry(fn, retries = 3) {
    let attempt = 0;
    while (attempt < retries) {
        try {
            return await fn();
        }
        catch (error) {
            attempt++;
            if (error instanceof Error) {
                console.warn(`Retrying (${attempt}/${retries}) due to error:`, error.message);
            }
            else {
                console.warn(`Retrying (${attempt}/${retries})`);
            }
        }
    }
    console.error('Failed after maximum retries.');
    return null;
}
// Recursive crawling and scraping function
async function crawlAndScrape(browser, currentUrl, baseUrl, depth = 0, maxDepth = 3) {
    if (visitedUrls.has(currentUrl) || depth > maxDepth)
        return [];
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
        const results = await Promise.all(links.map((link) => crawlAndScrape(browser, link, baseUrl, depth + 1, maxDepth)));
        return [...products, ...results.flat()];
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Failed to crawl: ${currentUrl}`, error.message);
        }
        await page.close();
        return [];
    }
}
// Main scraper function
async function startScraper(initialUrl) {
    const browser = await puppeteer_1.default.launch({ headless: true });
    try {
        const baseUrl = new URL(initialUrl).origin;
        const products = await crawlAndScrape(browser, initialUrl, baseUrl);
        const outputDir = path.resolve(__dirname, 'output');
        if (!fs.existsSync(outputDir))
            fs.mkdirSync(outputDir);
        const jsonFilePath = path.join(outputDir, 'products.json');
        fs.writeFileSync(jsonFilePath, JSON.stringify(products, null, 2));
        console.log('\n=== Scraped Product Data ===');
        console.table(products);
        console.log(`\nProduct data saved to ${jsonFilePath}`);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error('An error occurred:', error.message);
        }
        else {
            console.error('An unknown error occurred');
        }
    }
    finally {
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
