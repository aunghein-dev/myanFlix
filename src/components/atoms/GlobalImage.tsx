"use client";

import { JSX, useEffect, useRef } from "react";

interface AdConfig {
  key: string;
  width: number;
  height: number;
}

interface WindowWithAdsterra extends Window {
  atOptions?: {
    key: string;
    format: string;
    height: number;
    width: number;
    params: Record<string, unknown>;
  };
}

/**
 * 💎 Multi-banner-safe & Type-safe Adsterra Loader
 * - Fixes "only one ad visible" issue by sequencing script execution
 * - Safe cleanup + strict types
 */
export default function AdsterraBanner(): JSX.Element {
  const adRefDesktop = useRef<HTMLDivElement>(null);
  const adRefTablet = useRef<HTMLDivElement>(null);
  const adRefMobile = useRef<HTMLDivElement>(null);

  const loadAd = (container: HTMLDivElement, config: AdConfig, delay = 0): void => {
    const w = window as WindowWithAdsterra;

    setTimeout(() => {
      // Step 1: assign global config
      w.atOptions = {
        key: config.key,
        format: "iframe",
        height: config.height,
        width: config.width,
        params: {},
      };

      // Step 2: create script
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = `//www.highperformanceformat.com/${config.key}/invoke.js`;
      script.async = true;

      // Step 3: cleanup after load
      script.onload = () => {
        delete w.atOptions;
      };

      // Step 4: append script to container
      container.innerHTML = ""; // clear any previous ad
      container.appendChild(script);
    }, delay);
  };

  useEffect(() => {
    const desktop = adRefDesktop.current;
    const tablet = adRefTablet.current;
    const mobile = adRefMobile.current;

    // Load banners sequentially with short delays
    if (desktop) loadAd(desktop, { key: "d1da9187f471cbd87cbb4f8867a44278", width: 728, height: 90 }, 0);
    if (tablet) loadAd(tablet, { key: "b4928255eff94d6975b0490cf1eb8172", width: 468, height: 60 }, 250);
    if (mobile) loadAd(mobile, { key: "84d245d3ecc043dda0a8c5cd9b1d96e2", width: 320, height: 50 }, 500);

    return () => {
      if (desktop) desktop.innerHTML = "";
      if (tablet) tablet.innerHTML = "";
      if (mobile) mobile.innerHTML = "";
    };
  }, []);

  return (
    <div className="flex justify-center items-center w-full bg-transparent">
      {/* Desktop Banner */}
      <div className="hidden lg:flex justify-center items-center min-h-[120px]">
        <div ref={adRefDesktop} />
      </div>

      {/* Tablet Banner */}
      <div className="hidden md:flex lg:hidden justify-center items-center min-h-[90px]">
        <div ref={adRefTablet} />
      </div>

      {/* Mobile Banner */}
      <div className="flex md:hidden justify-center items-center min-h-[70px]">
        <div ref={adRefMobile} />
      </div>
    </div>
  );
}
