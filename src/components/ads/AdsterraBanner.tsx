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
 * 💎 AdsterraBanner — Production-ready
 * - Renders multiple instances safely (top & bottom)
 * - Responsive (728×90 / 468×60 / 320×50)
 * - Allows popups for ad clicks
 * - Type-safe and SSR-safe
 */
export default function AdsterraBanner({ placement = "top" }: AdsterraBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);

  /** Decide banner size & zone by screen width */
  const getResponsiveConfig = (): AdConfig => {
    const w = window.innerWidth;

    if (w >= 1024) {
      // Desktop
      return {
        key:
          placement === "bottom"
            ? "b4928255eff94d6975b0490cf1eb8172" // bottom zone
            : "d1da9187f471cbd87cbb4f8867a44278", // top zone
        width: 728,
        height: 90,
      };
    }
    if (w >= 768) {
      // Tablet
      return {
        key:
          placement === "bottom"
            ? "84d245d3ecc043dda0a8c5cd9b1d96e2"
            : "b4928255eff94d6975b0490cf1eb8172",
        width: 468,
        height: 60,
      };
    }
    // Mobile
    return { key: "84d245d3ecc043dda0a8c5cd9b1d96e2", width: 320, height: 50 };
  };

  /** Inject Adsterra script safely */
  const loadAd = (container: HTMLDivElement, cfg: AdConfig): void => {
    container.innerHTML = "";

    const iframe = document.createElement("iframe");
    iframe.width = String(cfg.width);
    iframe.height = String(cfg.height);
    iframe.frameBorder = "0";
    iframe.scrolling = "no";

    // ✅ Correct sandbox: allows scripts, same-origin, and popups for ad clicks
    iframe.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
    );

    Object.assign(iframe.style, {
      border: "none",
      display: "block",
      margin: "0 auto",
      maxWidth: "100%",
    });

    container.appendChild(iframe);

    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;display:flex;justify-content:center;align-items:center;">
          <script>
            window.atOptions = {
              key: "${cfg.key}",
              format: "iframe",
              height: ${cfg.height},
              width: ${cfg.width},
              params: {}
            };
          </script>
          <script src="//www.highperformanceformat.com/${cfg.key}/invoke.js"></script>
        </body>
      </html>
    `);
    doc.close();
  };

  useEffect(() => {
    const el = adRef.current;
    if (!el) return;

    loadAd(el, getResponsiveConfig());

    // Responsive reload on resize
    let timer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => loadAd(el, getResponsiveConfig()), 400);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
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
        className="w-full min-h-[70px] md:min-h-[90px] lg:min-h-[120px] flex justify-center items-center"
      />
    </div>
  );
}
