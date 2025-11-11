"use client";

import { useEffect, useRef } from "react";

/**
 * 💎 Fully Type-Safe, Responsive, Multi-Instance Adsterra Banner Component
 * - Supports multiple banners per page (e.g., top and bottom)
 * - Automatically adjusts to screen size (desktop/tablet/mobile)
 * - Cleans up safely and avoids global conflicts
 * - 100% TypeScript safe, ready for production
 */

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

interface AdsterraBannerProps {
  /** Optional placement name for analytics clarity */
  placement?: "top" | "bottom";
}

export default function AdsterraBanner({ placement }: AdsterraBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);

  /**
   * Select correct Adsterra zone key & size based on viewport
   */
  const getResponsiveConfig = (): AdConfig => {
    const width = window.innerWidth;

    if (width >= 1024) {
      // Desktop
      return {
        key:
          placement === "bottom"
            ? "b4928255eff94d6975b0490cf1eb8172" // Bottom zone key
            : "d1da9187f471cbd87cbb4f8867a44278", // Top zone key
        width: 728,
        height: 90,
      };
    } else if (width >= 768) {
      // Tablet
      return {
        key:
          placement === "bottom"
            ? "84d245d3ecc043dda0a8c5cd9b1d96e2"
            : "b4928255eff94d6975b0490cf1eb8172",
        width: 468,
        height: 60,
      };
    } else {
      // Mobile
      return {
        key:
          placement === "bottom"
            ? "84d245d3ecc043dda0a8c5cd9b1d96e2"
            : "84d245d3ecc043dda0a8c5cd9b1d96e2",
        width: 320,
        height: 50,
      };
    }
  };

  /**
   * Load Adsterra ad safely for each instance
   */
  const loadAd = (container: HTMLDivElement, config: AdConfig): void => {
    const w = window as WindowWithAdsterra;

    // Reset container (important for remounting or reloading)
    container.innerHTML = "";

    // Step 1: Assign temporary Adsterra config
    w.atOptions = {
      key: config.key,
      format: "iframe",
      height: config.height,
      width: config.width,
      params: {},
    };

    // Step 2: Create script element with unique timestamp (to avoid caching)
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `//www.highperformanceformat.com/${config.key}/invoke.js?t=${Date.now()}`;
    script.async = true;

    // Step 3: Once loaded, clean up global variable
    script.onload = () => {
      delete w.atOptions;
    };

    // Step 4: Inject script
    container.appendChild(script);
  };

  /**
   * Effect to handle mount, resize responsiveness, and cleanup
   */
  useEffect(() => {
    const el = adRef.current;
    if (!el) return;

    // Initial load
    const config = getResponsiveConfig();
    loadAd(el, config);

    // Debounced resize handler to reload ad on viewport change
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newConfig = getResponsiveConfig();
        loadAd(el, newConfig);
      }, 400);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      el.innerHTML = "";
    };
  }, [placement]);

  /**
   * Responsive container layout (Tailwind)
   */
  return (
    <div
      className={`flex justify-center items-center w-full bg-transparent ${
        placement === "top" ? "mt-2 mb-4" : "mt-6 mb-2"
      }`}
    >
      <div
        ref={adRef}
        className="min-h-[70px] md:min-h-[90px] lg:min-h-[120px] flex justify-center items-center"
      />
    </div>
  );
}
