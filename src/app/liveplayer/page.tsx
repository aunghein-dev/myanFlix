// src/app/liveplayer/page.tsx
import { Suspense } from "react";
import Spinner from "@/components/atoms/Spinner";
import LivePlayerContent from "./LivePlayerContent";
import AdsterraBanner from "@/components/ads/AdsterraBanner";

export default function LivePlayerPage() {
  return (
    <Suspense fallback={<Spinner className="min-h-screen flex items-center justify-center" />}>
      <LivePlayerContent />
      <AdsterraBanner placement="bottom" />
    </Suspense>
  );
}