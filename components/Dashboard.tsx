"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import EventStream from "./EventStream";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState({
    screenshotUrl: "",
    websiteUrl: "",
    businessName: "",
    industry: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(true);

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
      setIsLoading(false);
      // TODO: UPDATE THE UI WITH RESPONSE FROM DATA ANALYSIS
      console.log("Analysis completed:", openAiResponse);
    } catch (error) {
      console.error("Error analyzing data:", error);
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left Column */}
      <div className="space-y-6">
        {/* Preview Card */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="font-semibold text-gray-900">Website Preview</h3>
          </div>
          <div className="p-5">
            <div className="h-[400px] overflow-y-auto rounded-lg border-2 border-dashed border-gray-200">
              {data.screenshotUrl ? (
                <div className="relative w-full">
                  <Image
                    src={data.screenshotUrl}
                    alt="Website Screenshot"
                    width={1200}
                    height={1200}
                    className="w-full h-auto"
                    priority
                  />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-gray-500">No Preview Available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Website Details Card */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">Website Details</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500">URL</label>
              {data.websiteUrl && (
                <a
                  href={data.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  {data.websiteUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Business
              </label>
              <p className="mt-1 text-sm text-gray-900">{data.businessName}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Industry
              </label>
              <p className="mt-1 text-sm text-gray-900">{data.industry}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Analysis Progress Card */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="font-semibold text-gray-900">Analysis Progress</h3>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              <EventStream />
              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Confidence Scores Card */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="font-semibold text-gray-900">Confidence Scores</h3>
          </div>
          <div className="space-y-6 p-5">
            {["Ownership", "Certificates", "Restrictions", "Product Page"].map(
              (item) => (
                <div key={item}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {item}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      75%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                      style={{ width: "75%" }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4">
          <button className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
