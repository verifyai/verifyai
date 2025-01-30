import Dashboard from "../../components/Dashboard";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50/95">
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="mb-4">
          {/* <h2 className="-mt-6 text-2xl font-semibold text-gray-800">
            Website Analysis
          </h2>
          <p className="text-sm text-gray-600">
            Monitor and analyze your website&apos;s compliance status
          </p> */}
        </div>
        <Dashboard />
      </div>
    </div>
  );
}
