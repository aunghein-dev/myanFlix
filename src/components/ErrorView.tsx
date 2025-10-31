"use client";
import GlobalImage from "@/components/atoms/GlobalImage";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ErrorView({
  title = "Oh no. We lost this page",
  description = "We searched everywhere but couldn’t find what you’re looking for.",
}: {
  title?: string;
  description?: string;
}) {
  const [isImageVisible, setIsImageVisible] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(false);

  useEffect(() => {
    const imageTimer = setTimeout(() => setIsImageVisible(true), 100);
    const contentTimer = setTimeout(() => setIsContentVisible(true), 350);
    return () => {
      clearTimeout(imageTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  const retry = () => {
    window.location.reload();
  };

  const router = useRouter();

  return (
    <section className="min-h-screen w-full flex flex-col items-center justify-center p-4">
      <div className="transition duration-200 ease-in-out p-1 flex flex-col items-center w-full">
        <div className={`h-[280px] w-full max-w-[400px] relative overflow-hidden
          transition-all duration-700 ease-out hover:scale-105 
          ${isImageVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"}`}>
          <GlobalImage
            src="/404icon.svg"
            alt="Error Image"
            aria-label="Error State"
            fill
            className="object-contain"
          />
        </div>

        <div className={`flex flex-col items-center gap-1 mt-4
          transition-all duration-700 ease-out delay-200
          ${isContentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          
          <h1 className="text-2xl font-bold md:text-3xl text-gray-400/60">{title}</h1>
          <p className="text-gray-500 text-sm md:text-md text-center max-w-[420px]">
            {description}
          </p>

          <div className="mt-4 flex gap-3">
            <button 
            className="px-6 py-2 text-sm bg-gray-800 hover:bg-gray-900 text-white rounded-md transition"            
            onClick={retry}>Reload</button>
           <button
              className="px-6 py-2 text-sm bg-gray-800 hover:bg-gray-900 text-white rounded-md transition"
              onClick={() => {
                if (window.history.length > 2) {
                  window.history.go(-2);
                } else {
                  router.push("/");
                }
              }}
            >
              Back
            </button>

          </div>
        </div>
      </div>
    </section>
  );
}
