"use client";

import { useEffect } from "react";
import Script from "next/script";

interface BannerAdOptions {
  adKey: string; // renamed from key
  format?: "iframe" | "js";
  height?: number;
  width?: number;
  params?: Record<string, unknown>;
}

interface BannerAdProps extends BannerAdOptions {
  className?: string;
}

declare global {
  interface Window {
    atOptions?: BannerAdOptions;
  }
}

export default function BannerAd({
  adKey,
  format = "iframe",
  height = 250,
  width = 300,
  params = {},
  className,
}: BannerAdProps) {
  useEffect(() => {
    if (!window.atOptions) {
      window.atOptions = { adKey, format, height, width, params };
    }
  }, [adKey, format, height, width, params]);

  return (
    <div className={className}>
      <Script
        src={`//www.highperformanceformat.com/${adKey}/invoke.js`}
        strategy="lazyOnload"
      />
    </div>
  );
}
