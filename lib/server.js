import express from 'express';
import cors from 'cors';
const app = express();
import { scrape } from './middleware/simple-scraper.js';
import { analyzeUrls } from './middleware/open-ai.js';
import { scrapeProduct } from './middleware/data-scraper.js';
import { upsertProductsToPinecone } from './middleware/vectorDB.js';

// Enable CORS
app.use(cors());

// Enable JSON body parsing
app.use(express.json());

// Define port
const PORT = process.env.PORT || 3001;

// API endpoint for /api/run
app.post('/api/run', scrape, analyzeUrls, (req, res) => {
  try {
    res.json({
      message: 'Request processed successfully',
      data: res.locals.scrapedData,
      analysis: res.locals.analysis,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/scrape', scrapeProduct, upsertProductsToPinecone, (req, res) => {
  try{
    res.json({
      message: 'Request processed successfully',
      data: res.locals.scrapedData,
    });
  } catch (error){
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/restricted', processRestrictedItems, (req, res) => {
  try{
    res.json({
      message: 'Restricted items processed and upserted successfully',
    });
  } catch (error){
    res.status(500).json({ error: error.message });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
