import { NextResponse } from 'next/server';
import { broadcastAlert } from '@/app/lib/eventEmitter';

export async function POST(req: Request) {
  const body = await req.json();
  const { url } = body;
  const APIFLASH_TOKEN = process.env.APIFLASH_TOKEN;

  try {
    if (!url) {
      console.log('Error: No URL provided');
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!APIFLASH_TOKEN) {
      console.log('Error: No ApiFlash API token found');
      return NextResponse.json({ error: 'API token not configured' }, { status: 500 });
    }

    broadcastAlert({
      type: 'started',
      message: `Starting to capture screenshot of ${url}`,
      timestamp: Date.now(),
    });

    // Create the APIFlash API query URL
    const encodedUrl = encodeURIComponent(url);
    const apiUrl = `https://api.apiflash.com/v1/urltoimage?access_key=${APIFLASH_TOKEN}&url=${encodedUrl}&format=png&width=1280&full_page=true&quality=5&response_type=json`;

    // Fetch the screenshot URL from APIFlash
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`APIFlash API responded with status: ${response.status}`);
    }

    const data = await response.json();

    broadcastAlert({
      type: 'completed',
      message: `Screenshot URL received for ${url}`,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      imageUrl: data.url,
    });
  } catch (error) {
    console.error('Error capturing screenshot:', error);

    broadcastAlert({
      type: 'error',
      message: `Error capturing screenshot of ${url}: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
      timestamp: Date.now(),
    });
    return NextResponse.json({ error: 'Error capturing screenshot' }, { status: 500 });
  }
}
