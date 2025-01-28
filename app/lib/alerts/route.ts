import { NextRequest } from 'next/server';
import eventEmitter, { AlertMessage } from '../eventEmitter';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send an initial connection message
      controller.enqueue(
        encoder.encode(
          'data: {"type":"connected","message":"Processing started"}\n\n'
        )
      );

      const onAlert = (data: AlertMessage) => {
        const formattedData = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(formattedData));
      };

      // Subscribe to the 'alert' event for this connection
      eventEmitter.on('alert', onAlert);

      // Clean up listener and stream when the connection is closed
      req.signal?.addEventListener('abort', () => {
        eventEmitter.removeListener('alert', onAlert);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
