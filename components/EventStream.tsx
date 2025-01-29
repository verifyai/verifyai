'use client';

import { useEffect, useState } from 'react';

export type AlertMessage = {
  type: string;
  message: string;
  timestamp: number;
};

export default function EventStream() {
  const [events, setEvents] = useState<AlertMessage[]>([]);

  useEffect(() => {
    const eventSource = new EventSource('/lib/alerts');

    const handleMessage = (event: MessageEvent) => {
      const data: AlertMessage = JSON.parse(event.data);

      // Append new event only if it's not already in the list
      setEvents((prevEvents) => {
        const isDuplicate = prevEvents.some((e) => e.message === data.message);
        return isDuplicate ? prevEvents : [...prevEvents, data];
      });
    };

    eventSource.onmessage = handleMessage;

    eventSource.onerror = () => {
      console.error('EventSource connection failed.');
      eventSource.close();
    };

    // Cleanup on component unmount
    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div
      style={{
        padding: '8px',
      }}
    >
      <ul
        style={{ listStyle: 'none', padding: 0, textAlign: 'left', margin: 0 }}
      >
        {events.map((event, index) => (
          <li
            key={index}
            style={{
              fontWeight: index === events.length - 1 ? 'bold' : 'normal',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{ marginRight: '8px' }}>✅</span>
            <span>{event.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
