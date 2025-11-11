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
 * 💎 Fully Type-Safe Adsterra Banner Component
 * - Supports multiple banners per page
 * - Automatically clears global window.atOptions to prevent conflicts
 * - Strict TypeScript types (no `any`)
 * - Responsive layout: desktop / tablet / mobile
 */
export default function AdsterraBanner(): JSX.Element {
  const adRefDesktop = useRef<HTMLDivElement>(null);
  const adRefTablet = useRef<HTMLDivElement>(null);
  const adRefMobile = useRef<HTMLDivElement>(null);

  /**
   * Injects one Adsterra script safely with type protection.
   */
  const loadAd = (container: HTMLDivElement, config: AdConfig): void => {
    const w = window as WindowWithAdsterra;

    // Define temporary global Adsterra config
    w.atOptions = {
      key: config.key,
      format: "iframe",
      height: config.height,
      width: config.width,
      params: {},
    };

    // Create the Adsterra invoke script
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `//www.highperformanceformat.com/${config.key}/invoke.js`;
    script.async = true;

    // Once script finishes loading, clean up global variable
    script.onload = () => {
      delete w.atOptions;
    };

    // Append script to container
    container.appendChild(script);
  };

  /**
   * React effect: injects ads after mount and cleans up on unmount
   */
  useEffect(() => {
    const desktopRef = adRefDesktop.current;
    const tabletRef = adRefTablet.current;
    const mobileRef = adRefMobile.current;

    if (desktopRef)
      loadAd(desktopRef, { key: "d1da9187f471cbd87cbb4f8867a44278", width: 728, height: 90 });

    if (tabletRef)
      loadAd(tabletRef, { key: "b4928255eff94d6975b0490cf1eb8172", width: 468, height: 60 });

    if (mobileRef)
      loadAd(mobileRef, { key: "84d245d3ecc043dda0a8c5cd9b1d96e2", width: 320, height: 50 });

    return () => {
      if (desktopRef) desktopRef.innerHTML = "";
      if (tabletRef) tabletRef.innerHTML = "";
      if (mobileRef) mobileRef.innerHTML = "";
    };
  }, []);

  /**
   * Responsive Tailwind layout
   */
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
