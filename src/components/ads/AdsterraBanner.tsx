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
 * 💎 Production-ready Adsterra Banner
 * - Responsive (728×90 / 468×60 / 320×50)
 * - Supports multiple instances (top & bottom)
 * - Type-safe and SSR-safe
 */
export default function AdsterraBanner({ placement = "top" }: AdsterraBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);

  /** Decide banner size & zone by screen width */
  const getResponsiveConfig = (): AdConfig => {
    const width = window.innerWidth;
    if (width >= 1024) {
      return {
        key:
          placement === "bottom"
            ? "b4928255eff94d6975b0490cf1eb8172"
            : "d1da9187f471cbd87cbb4f8867a44278",
        width: 728,
        height: 90,
      };
    }
    if (width >= 768) {
      return {
        key:
          placement === "bottom"
            ? "84d245d3ecc043dda0a8c5cd9b1d96e2"
            : "b4928255eff94d6975b0490cf1eb8172",
        width: 468,
        height: 60,
      };
    }
    return { key: "84d245d3ecc043dda0a8c5cd9b1d96e2", width: 320, height: 50 };
  };

  /** Inject Adsterra script safely */
  const loadAd = (container: HTMLDivElement, config: AdConfig): void => {
    container.innerHTML = "";

    const iframe = document.createElement("iframe");
    iframe.width = String(config.width);
    iframe.height = String(config.height);
    iframe.frameBorder = "0";
    iframe.scrolling = "no";
    // safer sandbox: allow-scripts only, no same-origin
    iframe.setAttribute("sandbox", "allow-scripts");
    Object.assign(iframe.style, {
      border: "none",
      overflow: "hidden",
      display: "block",
      margin: "0 auto",
      maxWidth: "100%",
    });

    container.appendChild(iframe);

    const doc = iframe.contentDocument;
    if (!doc) return;

    // Write ad markup inside isolated document
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
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

    const cfg = getResponsiveConfig();
    loadAd(el, cfg);

    let resizeTimer: NodeJS.Timeout;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        loadAd(el, getResponsiveConfig());
      }, 400);
    };
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
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
