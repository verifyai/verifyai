'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Submitted URL:', url);
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
      </div>
    </div>
  );
}
