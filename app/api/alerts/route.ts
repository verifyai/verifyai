import eventEmitter, { AlertMessage } from '@/lib/eventEmitter';

export async function GET() {
  // Set headers for SSE
  const response = new Response(
    new ReadableStream({
      start(controller) {
        // Send initial connection message
        controller.enqueue('data: {"type":"connected","message":"Connected to event stream"}\n\n');

        // Listen for new alerts
        const onAlert = (data: AlertMessage) => {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        };

        eventEmitter.on('alert', onAlert);

        // Clean up when connection closes
        return () => {
          eventEmitter.removeListener('alert', onAlert);
        };
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    }
  );

  return response;
}
