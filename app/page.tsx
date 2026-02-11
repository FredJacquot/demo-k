"use client";

import { Suspense } from "react";
import NewChat from "@/components/conversation/new";

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <NewChat />
    </Suspense>
  );
}