"use client";

import { useSearchParams } from "next/navigation";
import ErrorView from "@/components/ErrorView";

function ErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message") ?? "Something went wrong";

  return (
    <ErrorView
      title="Oops!"
      description={message}
    />
  );
}

export default ErrorContent;