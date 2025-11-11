"use client";

import { useEffect, useRef } from "react";

interface AdConfig {
  key: string;
  width: number;
  height: number;
}

interface AdsterraBannerProps {
  placement?: "top" | "bottom";
}

/**
 * 💎 AdsterraBanner — Fully Responsive + Multi-Instance Safe
 * - Works for top & bottom banners simultaneously
 * - Creates isolated iframes per ad (no global conflicts)
 * - Responsive to screen size changes
 * - 100% TypeScript safe
 */
export default function AdsterraBanner({ placement }: AdsterraBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);

  const getResponsiveConfig = (): AdConfig => {
    const width = window.innerWidth;

    if (width >= 1024) {
      // Desktop
      return {
        key:
          placement === "bottom"
            ? "b4928255eff94d6975b0490cf1eb8172"
            : "d1da9187f471cbd87cbb4f8867a44278",
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
        key: "84d245d3ecc043dda0a8c5cd9b1d96e2",
        width: 320,
        height: 50,
      };
    }
  };

  /**
   * Create an isolated iframe for each banner to prevent global conflicts
   */
  const loadAd = (container: HTMLDivElement, config: AdConfig) => {
    // Clear container
    container.innerHTML = "";

    // Create isolated iframe
    const iframe = document.createElement("iframe");
    iframe.width = `${config.width}`;
    iframe.height = `${config.height}`;
    iframe.frameBorder = "0";
    iframe.scrolling = "no";
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    iframe.style.border = "none";
    iframe.style.overflow = "hidden";
    iframe.style.display = "block";
    iframe.style.margin = "0 auto";

    container.appendChild(iframe);

    // Write the Adsterra script directly into the iframe
    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`
      <html>
        <body style="margin:0;padding:0;display:flex;justify-content:center;align-items:center;">
          <script>
            window.atOptions = {
              key: "${config.key}",
              format: "iframe",
              height: ${config.height},
              width: ${config.width},
              params: {}
            };
          </script>
          <script src="//www.highperformanceformat.com/${config.key}/invoke.js"></script>
        </body>
      </html>
    `);
    doc.close();
  };

  useEffect(() => {
    const el = adRef.current;
    if (!el) return;

    const config = getResponsiveConfig();
    loadAd(el, config);

    // Handle window resize
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
