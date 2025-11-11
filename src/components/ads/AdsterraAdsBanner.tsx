"use client";

import { JSX, useEffect, useRef } from "react";

/**
 * 💎 Fully Type-Safe Adsterra Banner Component
 * - Tailwind responsive design (desktop / tablet / mobile)
 * - Strict TypeScript types (no `any`)
 * - Safe DOM operations
 * - Clean cleanup for performance
 */

interface AdConfig {
  key: string;
  width: number;
  height: number;
}

export default function AdsterraBanner(): JSX.Element {
  // Explicitly type refs as non-nullable div elements
  const adRefDesktop = useRef<HTMLDivElement>(null);
  const adRefTablet = useRef<HTMLDivElement>(null);
  const adRefMobile = useRef<HTMLDivElement>(null);

  /**
   * Loads a single Adsterra placement into the given container
   */
  const loadAd = (container: HTMLDivElement, config: AdConfig): void => {
    // Define Adsterra global configuration safely
    (window as unknown as { atOptions: AdConfig & { format: string; params: Record<string, unknown> } }).atOptions = {
      key: config.key,
      format: "iframe",
      height: config.height,
      width: config.width,
      params: {},
    };

    // Create Adsterra invoke script
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `//www.highperformanceformat.com/${config.key}/invoke.js`;
    script.async = true;

    // Append script to container
    container.appendChild(script);
  };

  /**
   * React hook: runs after component mounts to inject scripts
   */
  useEffect(() => {
    if (adRefDesktop.current)
      loadAd(adRefDesktop.current, { key: "d1da9187f471cbd87cbb4f8867a44278", width: 728, height: 90 });

    if (adRefTablet.current)
      loadAd(adRefTablet.current, { key: "b4928255eff94d6975b0490cf1eb8172", width: 468, height: 60 });

    if (adRefMobile.current)
      loadAd(adRefMobile.current, { key: "84d245d3ecc043dda0a8c5cd9b1d96e2", width: 320, height: 50 });

    // Cleanup on unmount
    return () => {
      if (adRefDesktop.current) adRefDesktop.current.innerHTML = "";
      if (adRefTablet.current) adRefTablet.current.innerHTML = "";
      if (adRefMobile.current) adRefMobile.current.innerHTML = "";
    };
  }, []);

  /**
   * Component layout (responsive Tailwind design)
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
