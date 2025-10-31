// src/app/liveplayer/page.tsx
import { Suspense } from "react";
import Spinner from "@/components/atoms/Spinner";
import LivePlayerContent from "./LivePlayerContent";

export default function LivePlayerPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LivePlayerContent />
    </Suspense>
  );
}