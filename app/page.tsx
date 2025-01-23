'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Submitted URL:', url);
    setLoading(true);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      setScreenshot(data.screenshot);
      setHtmlContent(data.htmlContent);
      console.log('Screenshot:', data.screenshot);
      console.log('HTML Content:', data.htmlContent);
    } catch (error) {
      console.error('Error fetching screenshot and HTML content:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <h1 className="text-4xl font-bold mt-56"> Enter a Website </h1>
      <div className="mt-8">
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <input
            type="text"
            className="border border-gray-300 p-2 rounded-md text-black mb-4"
            placeholder="URL Here"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-md"
          >
            Submit
          </button>
        </form>
        {loading && <div className="mt-8">Loading...</div>}
        <div className="flex-row mt-8 gap-5">
          {screenshot && (
            <div className="p-4 border border-gray-300 rounded-md">
              <h2 className="text-2xl font-bold">Screenshot:</h2>
              <img src={`data:image/png;base64,${screenshot}`} alt="Screenshot" />
            </div>
          )}
          {htmlContent && (
            <div className="p-4 border border-gray-300 rounded-md w-96">
              <h2 className="text-2xl font-bold">HTML Content:</h2>
              <pre className="whitespace-pre-wrap">{htmlContent}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}