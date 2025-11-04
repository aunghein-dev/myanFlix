"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";

interface BannerAdProps {
  keyId?: string;
  href?: string;
}

declare global {
  interface Window {
    atOptions?: {
      key: string;
      format: string;
      params: Record<string, unknown>;
    };
  }
}

export default function BannerAd({
  keyId = "d1da9187f471cbd87cbb4f8867a44278",
  href = "#",
}: BannerAdProps) {
  const [visible, setVisible] = useState(true);
  const [showClose, setShowClose] = useState(false);

  // Inject ad script
  useEffect(() => {
    if (!visible) return;

    window.atOptions = {
      key: keyId,
      format: "iframe",
      params: {},
    };

    const script = document.createElement("script");
    script.src = `//www.highperformanceformat.com/${keyId}/invoke.js`;
    script.type = "text/javascript";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      delete window.atOptions;
    };
  }, [keyId, visible]);

  // Delay close button
  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => setShowClose(true), 3000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full px-4 sm:px-2">
      <div className="mx-auto max-w-6xl sm:max-w-2xl md:max-w-3xl lg:max-w-5xl relative w-full rounded overflow-hidden shadow-lg bg-gray-100/10">
        {showClose && (
          <button
            onClick={() => setVisible(false)}
            className="absolute top-1 right-1 z-50 text-gray-500 hover:text-gray-900 p-1 rounded-full bg-white/10 hover:bg-white/20 transition"
            aria-label="Close Ad"
          >
            <X size={16} />
          </button>
        )}

        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full"
        >
          <div className="w-full h-0 relative" style={{ paddingBottom: "12.5%" }}>
            <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center overflow-hidden">
              {/* Script will inject iframe here */}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
