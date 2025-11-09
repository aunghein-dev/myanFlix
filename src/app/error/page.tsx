import { Suspense } from "react";
import ErrorContent from "./ErrorContent";
import Spinner from "@/components/atoms/Spinner";


export default function ErrorPage() {
  return (
    <Suspense fallback={<Spinner className="min-h-screen flex items-center justify-center"/>}>
      <ErrorContent />
    </Suspense>
  );
}