'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import EventStream from './EventStream';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import gsap from 'gsap';

export default function Dashboard() {
  // State to store website data (retrieved from localStorage)
  const [data, setData] = useState({
    screenshotUrl: '',
    websiteUrl: '',
    businessName: '',
    industry: '',
    description: '',
  });

  // Controls loading state while analysis is running
  const [isLoading, setIsLoading] = useState(true);

  // Stores OpenAI website analysis results
  const [analysisSummary, setAnalysisSummary] = useState<string>('Fetching analysis...');
  const [analysisScores, setAnalysisScores] = useState({
    overallScore: 0,
    restrictedItems: { score: 0, message: '' },
    productPages: { score: 0, message: '' },
    ownership: { score: 0, message: '' },
    overallSafety: { score: 0, message: '' },
  });

  // Hardcoded confidence scores as fallback
  const confidenceScores = {
    Ownership: analysisScores.ownership.score || 95,
    'No Restricted Items': analysisScores.restrictedItems.score || 83,
    'Product Page': analysisScores.productPages.score || 90,
    'Overall Safety': analysisScores.overallSafety.score || 85,
  };

  const overallScore = analysisScores.overallScore || 87; // Default score

  // Refs for animating elements using GSAP
  const analysisCardRef = useRef(null);
  const confidenceCardRef = useRef(null);

  // Fetches a screenshot of the website, stores it in localStorage, and returns the image URL
  const fetchScreenshot = async () => {
    try {
      const websiteUrl = localStorage.getItem('websiteUrl');
      if (!websiteUrl) throw new Error('No website URL found in localStorage.');

      const response = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl }),
      });

      const data = await response.json();
      localStorage.setItem('screenshotUrl', data.imageUrl);
      return data.imageUrl;
    } catch (error) {
      console.error('Error during loading:', error);
      return null;
    }
  };

  // Sends the website URL and screenshot to the API for analysis, then updates the state
  const startWebsiteAnalysis = useCallback(async () => {
    try {
      console.log('Starting website analysis...');
      const screenshotUrlHard = `http://localhost:3000${data.screenshotUrl}`;

      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl: data.websiteUrl,
          screenshotUrl: screenshotUrlHard,
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze website');

      const result = await response.json();

      console.log('Full API Response:', result);

      // Extract and update the summary
      setAnalysisSummary(result.screenshotAnalysis.metadata.summary || 'No summary available.');

      // Store confidence scores from OpenAI response
      setAnalysisScores({
        overallScore: result.screenshotAnalysis.score || 0,
        restrictedItems: result.screenshotAnalysis.metadata.restrictedItems || { score: 0, message: '' },
        productPages: result.screenshotAnalysis.metadata.productPages || { score: 0, message: '' },
        ownership: result.screenshotAnalysis.metadata.ownership || { score: 0, message: '' },
        overallSafety: result.screenshotAnalysis.metadata.overallSafety || { score: 0, message: '' },
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error analyzing website:', error);
    }
  }, [data]);

  // Initializes data when the component mounts (fetches website info and screenshot)
  useEffect(() => {
    const initializeData = async () => {
      const screenshotUrl = await fetchScreenshot();
      setData({
        screenshotUrl: screenshotUrl || '',
        websiteUrl: localStorage.getItem('websiteUrl') || '',
        businessName: localStorage.getItem('businessName') || '',
        industry: localStorage.getItem('industry') || '',
        description: localStorage.getItem('description') || '',
      });
    };

    initializeData();
  }, []);

  // Starts website analysis once all necessary data is available
  useEffect(() => {
    if (Object.values(data).every((value) => value)) {
      startWebsiteAnalysis();
    }
  }, [data, startWebsiteAnalysis]);

  // Animates elements when loading completes
  useEffect(() => {
    if (!isLoading) {
      gsap.fromTo(
        [analysisCardRef.current, confidenceCardRef.current],
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.6, stagger: 0.2, ease: 'power2.out' }
      );
    }
  }, [isLoading]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column */}
      <div className="space-y-6">
        {/* Website Details */}
        <div className="rounded-xl border border-gray-300 bg-white p-5 shadow-sm">
          <h3 className="mb-1 font-semibold text-gray-900">Website Details</h3>
          <div className="space-y-1">
            {/* Website URL */}
            <div>
              <label className="text-xs font-medium text-gray-500">URL</label>
              {data.websiteUrl ? (
                <a
                  href={data.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  {data.websiteUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <p className="mt-1 text-sm text-gray-500 animate-pulse">Fetching URL...</p>
              )}
            </div>

            {/* Business Name */}
            <div>
              <label className="text-xs font-medium text-gray-500">Business</label>
              <p className="mt-1 text-sm text-gray-900">
                {data.businessName ? data.businessName : <span className="text-gray-500 animate-pulse">Fetching Business Name...</span>}
              </p>
            </div>

            {/* Industry */}
            <div>
              <label className="text-xs font-medium text-gray-500">Industry</label>
              <p className="mt-1 text-sm text-gray-900">
                {data.industry ? data.industry : <span className="text-gray-500 animate-pulse">Fetching Industry...</span>}
              </p>
            </div>
          </div>
        </div>
        
        {/* Website Preview */}
        <div className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h3 className="font-semibold text-gray-900">Website Preview</h3>
          </div>
          <div className="p-5">
            <div className="h-[450px] overflow-y-auto rounded-lg border-2 border-dashed border-gray-200">
              {data.screenshotUrl ? (
                <Image
                  src={data.screenshotUrl}
                  alt="Website Screenshot"
                  width={1200}
                  height={1200}
                  className="w-full h-auto"
                  priority
                />
              ) : (
                <div className="flex h-[450px] items-center justify-center">
                  <p className="text-sm text-gray-500">No Preview Available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Analysis Progress (Only visible while loading) */}
        {isLoading && (
          <div className="rounded-xl border border-gray-300 bg-white shadow-sm h-[715px]">
            <div className="border-b border-gray-200 px-5 py-4">
              <h3 className="font-semibold text-gray-900">Analysis Progress</h3>
            </div>
            <div className="p-5">
              <EventStream />
              <div className="flex items-center justify-center py-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            </div>
          </div>
        )}

        {/* Website Analysis & Confidence Scores (Slide in when loading completes) */}
        {!isLoading && (
          <>
            {/* Website Analysis Card */}
            <div ref={analysisCardRef} className="rounded-xl border border-gray-300 bg-white shadow-sm opacity-0">
              <div className="border-b border-gray-200 px-5 py-4">
                <h3 className="font-semibold text-gray-900">OpenAI Analysis</h3>
              </div>
              <div className="p-6 text-gray-800 text-sm">
                {analysisSummary}
              </div>
            </div>

            {/* Confidence Scores Card */}
            <div ref={confidenceCardRef} className="rounded-xl border border-gray-300 bg-white shadow-sm opacity-0">
              <div className="border-b border-gray-200 px-5 py-4">
                <h3 className="font-semibold text-gray-900">Confidence Scores</h3>
              </div>
              <div className="space-y-6 p-5">
                {/* Overall Score Bar */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Overall Score</span>
                    <span className="text-sm font-medium text-gray-900">{overallScore}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-500 to-blue-600"
                      style={{ width: `${overallScore}%` }}
                    />
                  </div>
                </div>

                {/* Individual Confidence Scores */}
                {Object.entries(confidenceScores).map(([label, score]) => (
                  <div key={label}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                      <span className="text-sm font-medium text-gray-900">{score}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4">
          <button className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200">
            <ArrowLeft className="h-4 w-4" /> Go Back
          </button>
          <button className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
