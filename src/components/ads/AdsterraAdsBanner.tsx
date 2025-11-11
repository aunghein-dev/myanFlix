"use client";

import { useEffect, useRef } from "react";

/**
 * 💎 Professional Adsterra Banner Component
 * Responsive, optimized for CPM & layout stability
 * - Uses Tailwind CSS for responsive scaling
 * - Avoids window.innerWidth detection
 * - Ideal for Next.js streaming or entertainment sites
 */

export default function AdsterraBanner() {
  const adRefDesktop = useRef<HTMLDivElement>(null);
  const adRefTablet = useRef<HTMLDivElement>(null);
  const adRefMobile = useRef<HTMLDivElement>(null);

  // Helper to load Adsterra script
  const loadScript = (container: HTMLDivElement, key: string, width: number, height: number) => {
    const script1 = document.createElement("script");
    script1.type = "text/javascript";
    script1.innerHTML = `
      atOptions = {
        'key': '${key}',
        'format': 'iframe',
        'height': ${height},
        'width': ${width},
        'params': {}
      };
    `;
    const script2 = document.createElement("script");
    script2.type = "text/javascript";
    script2.src = `//www.highperformanceformat.com/${key}/invoke.js`;
    container.appendChild(script1);
    container.appendChild(script2);
  };

  useEffect(() => {
    if (adRefDesktop.current)
      loadScript(adRefDesktop.current, "d1da9187f471cbd87cbb4f8867a44278", 728, 90);
    if (adRefTablet.current)
      loadScript(adRefTablet.current, "b4928255eff94d6975b0490cf1eb8172", 468, 60);
    if (adRefMobile.current)
      loadScript(adRefMobile.current, "84d245d3ecc043dda0a8c5cd9b1d96e2", 320, 50);

    return () => {
      adRefDesktop.current && (adRefDesktop.current.innerHTML = "");
      adRefTablet.current && (adRefTablet.current.innerHTML = "");
      adRefMobile.current && (adRefMobile.current.innerHTML = "");
    };
  }, []);

  return (
    <div className="flex justify-center items-center w-full bg-transparent">
      {/* Desktop Banner */}
      <div className="hidden lg:flex justify-center items-center min-h-[120px]">
        <div ref={adRefDesktop} className="flex justify-center items-center" />
      </div>

      {/* Tablet Banner */}
      <div className="hidden md:flex lg:hidden justify-center items-center min-h-[90px]">
        <div ref={adRefTablet} className="flex justify-center items-center" />
      </div>

      {/* Mobile Banner */}
      <div className="flex md:hidden justify-center items-center min-h-[70px]">
        <div ref={adRefMobile} className="flex justify-center items-center" />
      </div>
    </div>
  );
}
