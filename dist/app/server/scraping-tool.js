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
// Auto-scroll function
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
// Function to clean data
function cleanText(text) {
    return text.replace(/\s+/g, ' ').replace(/\\n/g, '').trim();
}
// Scraper function
async function scrapeProductData(url) {
    const browser = await puppeteer_1.default.launch({ headless: true });
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
            const productData = [];
            productElements.forEach((product) => {
                var _a, _b, _c, _d, _e;
                let name = ((_a = product.querySelector('[class*="name"], [class*="title"], h2, h3')) === null || _a === void 0 ? void 0 : _a.textContent) || '';
                let price = ((_b = product.querySelector('[class*="price"], .amount, [data-price]')) === null || _b === void 0 ? void 0 : _b.textContent) || '';
                let imageUrl = ((_c = product.querySelector('img')) === null || _c === void 0 ? void 0 : _c.getAttribute('src')) ||
                    ((_d = product.querySelector('img')) === null || _d === void 0 ? void 0 : _d.getAttribute('data-src')) ||
                    ((_e = product.querySelector('img')) === null || _e === void 0 ? void 0 : _e.getAttribute('data-lazy-src')) ||
                    '';
                // Clean data
                name = name.trim().toLowerCase();
                price = price.trim().toLowerCase();
                // Skip unwanted products
                if (excludeKeywords.some((keyword) => name.includes(keyword)))
                    return;
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
        if (!products.length)
            throw new Error('No products found. Retrying...');
        // Clean final data
        const cleanedProducts = products.map((product) => ({
            name: cleanText(product.name),
            price: cleanText(product.price),
            imageUrl: product.imageUrl,
        }));
        // Save data
        const outputDir = path.resolve(__dirname, 'output');
        if (!fs.existsSync(outputDir))
            fs.mkdirSync(outputDir);
        const jsonFilePath = path.join(outputDir, 'products_cleaned.json');
        fs.writeFileSync(jsonFilePath, JSON.stringify(cleanedProducts, null, 2));
        console.log('\n=== Scraped Product Data ===');
        console.table(cleanedProducts);
        console.log(`\nProduct data saved to ${jsonFilePath}`);
        return cleanedProducts;
    }
    catch (error) {
        console.error('An error occurred while scraping:', error);
        return [];
    }
    finally {
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
