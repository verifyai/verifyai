import express, { Request, Response } from 'express';
import cors from 'cors';
const app = express();
import { scrape } from './middleware/sitemap-generator';
import { analyzeUrls } from './middleware/open-ai';

// Enable CORS
app.use(cors());

// Enable JSON body parsing
app.use(express.json());

// Define port
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3001;

// API endpoint for /api/run
app.post('/api/run', scrape, analyzeUrls, (req: Request, res: Response) => {
  try {
    res.json({
      message: 'Request processed successfully',
      data: res.locals.scrapedData,
      analysis: res.locals.analysis,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
