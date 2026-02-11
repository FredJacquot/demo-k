import { Suspense } from "react";
import TrackingPageContent from "@/components/tracking/tracking-page-content";

export default function TrackingPage() {
  return (
    <Suspense fallback={
      <div className="p-8">
        <div className="mb-8">
          <div className="h-8 bg-muted rounded w-64 mb-4 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-96 mb-2 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border rounded-lg p-6 animate-pulse"
            >
              <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    }>
      <TrackingPageContent />
    </Suspense>
  );
}
