'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import EventStream from '@/components/EventStream'; // Ensure this path matches your setup

export default function LoadingPage() {
  const router = useRouter();
  const [loadingError, setLoadingError] = useState(false);

  useEffect(() => {
    const fetchScreenshot = async () => {
      try {
        const websiteUrl = localStorage.getItem('websiteUrl');

        if (!websiteUrl) {
          throw new Error('No website URL found in localStorage.');
        }

        const response = await fetch('/api/screenshot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: websiteUrl }),
        });

        const data = await response.json();

        // Save screenshot URL and other details to localStorage
        localStorage.setItem('screenshotUrl', data.imageUrl);

        setTimeout(() => {
          router.push('/dashboard'); // Added 1 sec delay for the user to witness the last step
        }, 1000);
      } catch (error) {
        console.error('Error during loading:', error);
        setLoadingError(true);
      }
    };

    fetchScreenshot();
  }, [router]);

  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center">
      {!loadingError ? (
        <>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
          <EventStream />
        </>
      ) : (
        <p className="text-red-500">
          An error occurred while loading. Please try again.
        </p>
      )}
    </div>
  );
}
