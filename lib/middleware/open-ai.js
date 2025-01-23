import OpenAI from 'openai';
import 'dotenv/config';

console.log(process.env.OPENAI_API_KEY);

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async determineTargetURLs(urls) {
    const systemPrompt = `You are a URL analysis expert. From the provided list of URLs,
            identify exactly 4 URLs that represent:
            1. The website's homepage
            2. A product page
            3. A checkout page
            4. Any page that appears suspicious or potentially malicious

            Return the results in this exact JSON format:
            {
              "homepage": "url1",
              "product": "url2",
              "checkout": "url3",
              "suspicious": "url4"
            }
            Provide only the JSON object, no additional explanation.`;

    try {
      console.log('Analyzing URLs with OpenAI:', urls.join(', '));
      const response = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Please analyze these URLs: ${urls.join(', ')}`,
          },
        ],
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error in OpenAI API call:', error);
      throw new Error('Failed to analyze URLs with OpenAI');
    }
  }
}

const service = new OpenAIService();

export const analyzeUrls = async (req, res, next) => {
  try {
    const urls = res.locals.scrapedData.links;
    const analysis = await service.determineTargetURLs(urls);
    console.log(analysis);
    res.locals.analysis = analysis;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
