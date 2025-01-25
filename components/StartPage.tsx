'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { set } from 'idb-keyval';

export default function StartPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

      // Save screenshot and website URL in IndexedDB
      await set('screenshot', data.screenshot);
      localStorage.setItem('htmlContent', data.htmlContent);
      localStorage.setItem('websiteUrl', url); // Save website URL

      router.push('/dashboard');
    } catch (error) {
      console.error('Error fetching screenshot and HTML content:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <h1 className="text-4xl font-bold mt-56">Enter a Website</h1>
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
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Submit'}
          </button>
        </form>
        {loading && <div className="mt-8">Loading...</div>}
      </div>
    </div>
  );
}
