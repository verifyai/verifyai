"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import EventStream from "./EventStream";

export default function Dashboard() {
  const [data, setData] = useState({
    screenshotUrl: "",
    websiteUrl: "",
    businessName: "",
    industry: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const fetchScreenshot = async () => {
    try {
      const websiteUrl = localStorage.getItem("websiteUrl");

      if (!websiteUrl) {
        throw new Error("No website URL found in localStorage.");
      }

      const response = await fetch("/api/screenshot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: websiteUrl }),
      });

      const data = await response.json();
      localStorage.setItem("screenshotUrl", data.imageUrl);
      return data.imageUrl;
    } catch (error) {
      console.error("Error during loading:", error);
      setLoadingError(true);
      return null;
    }
  };

  const startWebsiteAnalysis = useCallback(async () => {
    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          websiteUrl: data.websiteUrl,
          businessName: data.businessName,
          industry: data.industry,
          description: data.description,
          screenshotUrl: data.screenshotUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze screenshot");
      }

      const openAiResponse = await response.json();
      setAnalysisComplete(true);
      setIsLoading(false);
      // TODO: UPDATE THE UI WITH RESPONSE FROM DATA ANALYSIS
      console.log("Analysis completed:", openAiResponse);
    } catch (error) {
      console.error("Error analyzing data:", error);
      setLoadingError(true);
      setIsLoading(false);
    }
  }, [data]);

  useEffect(() => {
    const initializeData = async () => {
      // First fetch the screenshot
      const screenshotUrl = await fetchScreenshot();

      // Then set all the data
      setData({
        screenshotUrl: screenshotUrl || "",
        websiteUrl: localStorage.getItem("websiteUrl") || "",
        businessName: localStorage.getItem("businessName") || "",
        industry: localStorage.getItem("industry") || "",
        description: localStorage.getItem("description") || "",
      });
    };

    initializeData();
  }, []);

  useEffect(() => {
    const isDataComplete = Object.values(data).every((value) => value);
    if (isDataComplete) {
      startWebsiteAnalysis();
    }
  }, [data, startWebsiteAnalysis]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-black">
      <div className="flex flex-row w-full max-w-6xl gap-4 p-6 bg-white shadow-lg rounded-xl">
        {/* Left Section */}
        <div className="flex-1 border rounded-lg p-4 bg-gray-100">
          <h2 className="text-xl font-semibold text-center mb-4 text-black">
            Website Preview
          </h2>
          <div className="h-[400px] w-full bg-white border-dashed border-2 border-gray-300 rounded-lg overflow-hidden relative">
            {data.screenshotUrl ? (
              <div className="h-full w-full overflow-y-scroll">
                <Image
                  src={data.screenshotUrl}
                  alt="Website Screenshot"
                  width={400}
                  height={300}
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
              {data.websiteUrl && (
                <a
                  href={data.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  {data.websiteUrl}
                </a>
              )}
            </p>
            <p className="text-sm mt-2">
              {data.description && (
                <span className="font-medium">
                  Description: {data.description}
                </span>
              )}
            </p>
          </div>

          {/* Progress */}
          <div className="p-4 border rounded-lg bg-gray-100">
            <h3 className="text-lg font-semibold mb-4">Progress</h3>
            <div className="space-y-4">
              <EventStream />
              {isLoading && (
                <div className="flex justify-center mt-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                </div>
              )}
              {loadingError && (
                <p className="text-red-500 mt-4">
                  An error occurred while loading. Please try again.
                </p>
              )}
            </div>
          </div>

          {/* Confidence Score */}
          <div className="p-4 border rounded-lg bg-gray-100">
            <h3 className="text-lg font-semibold mb-4">
              OpenAI Confidence Score
            </h3>
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
