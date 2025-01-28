'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StartPage() {
  const [formData, setFormData] = useState({
    businessName: '',
    url: '',
    industry: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitted data:', formData);
    setLoading(true);

    try {
      const response = await fetch('/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: formData.url }),
      });

      const data = await response.json();

      // Save form data in localStorage
      localStorage.setItem('websiteUrl', formData.url);
      localStorage.setItem('screenshotUrl', data.imageUrl);
      localStorage.setItem('businessName', formData.businessName);
      localStorage.setItem('industry', formData.industry);
      localStorage.setItem('description', formData.description);

      router.push('/dashboard');
    } catch (error) {
      console.error('Error fetching screenshot and HTML content:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center bg-black">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Business Information</h2>
          <p className="text-gray-600 mb-6">Enter your business details below</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                Business Name
              </label>
              <input
                id="businessName"
                name="businessName"
                type="text"
                placeholder="Enter your business name"
                value={formData.businessName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-400"
              />
            </div>
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                Website URL
              </label>
              <input
                id="url"
                name="url"
                type="url"
                placeholder="https://example.com"
                value={formData.url}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-400"
              />
            </div>
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                Website Industry
              </label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              >
                <option value="">Select an industry</option>
                <option value="ecommerce">E-commerce</option>
                <option value="blog">Blog</option>
                <option value="portfolio">Portfolio</option>
                <option value="corporate">Corporate</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Short Description
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Briefly describe your business"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-400"
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
      {loading && (
        <div className="mt-8 text-center text-gray-600">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mr-2"></div>
          Loading...
        </div>
      )}
    </div>
  );
}
