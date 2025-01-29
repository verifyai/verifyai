"use client";

import { useEffect, useState } from "react";

export type AlertMessage = {
  type: string;
  message: string;
  timestamp: number;
};

export default function EventStream() {
  const [events, setEvents] = useState<AlertMessage[]>([]);

  useEffect(() => {
    const eventSource = new EventSource("/lib/alerts");

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
      console.error("EventSource connection failed.");
      eventSource.close();
    };

    // Cleanup on component unmount
    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="space-y-2">
      {events.map((event, index) => (
        <div key={index} className="flex items-center text-sm">
          <div className="w-4 h-4 border-2 bg-green-500 border-green-500 rounded-full mr-2 flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
          <span>{event.message}</span>
        </div>
      ))}
    </div>
  );
}
