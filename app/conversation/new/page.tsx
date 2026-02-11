"use client";

import { Suspense } from "react";
import NewChat from "@/components/conversation/new";

function NewChatWrapper() {
  return <NewChat />;
}

export default function Home() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <NewChatWrapper />
    </Suspense>
  );
}
