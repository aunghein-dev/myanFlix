import ErrorView from "@/components/ErrorView";

export default function NotFound() {
  return (
    <ErrorView
      title="Oh no. We lost this page"
      description="We searched everywhere but couldn’t find what you’re looking for."
    />
  );
}
