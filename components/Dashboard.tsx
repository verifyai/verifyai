"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { get, set } from "idb-keyval";

export default function Dashboard() {
  const [screenshot, setScreenshotState] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loadingScreenshot, setLoadingScreenshot] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const fetchScreenshot = async () => {
    setLoadingScreenshot(true);
    try {
      const response = await fetch("/api/screenshot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: websiteUrl }),
      });

      const data = await response.json();
      if (data.screenshot) {
        setScreenshotState(data.screenshot);
        setHtmlContent(data.htmlContent);

        // Save screenshot in IndexedDB for persistence
        await set("screenshot", data.screenshot);
        await set("htmlContent", data.htmlContent);
      }
    } catch (error) {
      console.error("Error fetching screenshot:", error);
    } finally {
      setLoadingScreenshot(false);
    }
  };

  const analyzeScreenshot = async () => {
    setLoadingAnalysis(true);
    try {
      const response = await fetch("/api/analyze-screenshot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ screenshot }),
      });

      const data = await response.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error("Error analyzing screenshot:", error);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    // Load existing screenshot from IndexedDB
    const loadScreenshot = async () => {
      const storedScreenshot = await get("screenshot");
      const storedHtmlContent = await get("htmlContent");

      if (storedScreenshot) {
        setScreenshotState(storedScreenshot);
        setHtmlContent(storedHtmlContent || "");
      } else {
        fetchScreenshot(); // Fetch screenshot if not available
      }
    };

    loadScreenshot();
  }, []);

  // Trigger analysis when screenshot is loaded
  useEffect(() => {
    if (screenshot) {
      analyzeScreenshot();
    }
  }, [screenshot]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-black">
      <div className="flex flex-row w-full max-w-6xl gap-4 p-6 bg-white shadow-lg rounded-xl">
        {/* Left Section */}
        <div className="flex-1 border rounded-lg p-4 bg-gray-100">
          <h2 className="text-xl font-semibold text-center mb-4 text-black">
            Website Preview
          </h2>
          <div className="h-[400px] w-full bg-white border-dashed border-2 border-gray-300 rounded-lg overflow-hidden relative">
            {screenshot ? (
              <div className="h-full w-full overflow-y-scroll">
                <Image
                  src={`data:image/png;base64,${screenshot}`}
                  alt="Website Screenshot"
                  width={400} // Adjust as needed
                  height={300} // Adjust as needed
                  className="w-full object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No Preview Available</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex flex-col flex-1 gap-6">
          {/* Website Details */}
          <div className="p-4 border rounded-lg bg-gray-100">
            <h3 className="text-lg font-semibold mb-2">Website Details</h3>
            <p className="text-sm">
              <span className="font-medium">Website URL:</span>{" "}
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  {websiteUrl}
                </a>
              )}
            </p>
            <p className="text-sm mt-2">
              <span className="font-medium">Description:</span>
            </p>
          </div>

          {/* Progress */}
          <div className="p-4 border rounded-lg bg-gray-100">
            <h3 className="text-lg font-semibold mb-4">Progress</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-gray-400 rounded-full mr-2"></div>
                <p>Scanning Website</p>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-gray-400 rounded-full mr-2"></div>
                <p>Checking Restrictions</p>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-gray-400 rounded-full mr-2"></div>
                <p>Checking Compliance</p>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-gray-400 rounded-full mr-2"></div>
                <p>Scoring</p>
              </div>
            </div>
          </div>

          {/* Analysis Section */}
        <div className="flex-1 p-4 border rounded-lg bg-gray-100">
          <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
          {loadingAnalysis ? (
            <p>Analyzing screenshot...</p>
          ) : analysis ? (
            <pre className="text-sm bg-gray-200 p-2 rounded-lg overflow-auto">
              {JSON.stringify(analysis, null, 2)}
            </pre>
          ) : (
            <p>No analysis available</p>
          )}
        </div>

          {/* Confidence Score */}
          <div className="p-4 border rounded-lg bg-gray-100">
            <h3 className="text-lg font-semibold mb-4">Confidence Score</h3>
            <div className="space-y-3">
              {[
                "Ownership",
                "Certificates",
                "Restrictions",
                "Product Page",
              ].map((item) => (
                <div key={item}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item}</span>
                  </div>
                  <div className="relative h-2 bg-gray-300 rounded-full">
                    <div className="absolute h-2 bg-purple-500 rounded-full w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between">
            <button className="px-4 py-2 text-sm font-medium text-white bg-gray-500 rounded-lg hover:bg-gray-600">
              Go Back
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-slate-950 rounded-lg hover:bg-blue-700">
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
