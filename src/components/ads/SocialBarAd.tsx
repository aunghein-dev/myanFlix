"use client";

import { JSX, useEffect, useState, useMemo, useCallback } from "react";
import Script from "next/script";

interface SocialBarAdProps {
  scriptSrc?: string;
  siteId?: string; // Optional: Social Bar provider site ID
}

interface FallbackAd {
  id: string;
  name: string;
  src: string;
  delay?: number;
}

interface SocialBarWindow extends Window {
  SocialBar?: {
    init?: (options?: { siteId?: string }) => void;
  };
}

export default function SocialBarAd({
  scriptSrc = "//pl27965725.effectivegatecpm.com/9a/61/56/9a6156d154dc1851a1897a71a24d9eb2.js",
  siteId = "",
}: SocialBarAdProps) {
  const [showFallbacks, setShowFallbacks] = useState(false);
  const [fallbackScripts, setFallbackScripts] = useState<JSX.Element[]>([]);
  const isProduction = true;

  /** Memoize fallback ads to avoid recreating on every render */
  const fallbackAds = useMemo<FallbackAd[]>(
    () => [
      {
        id: "video-slider",
        name: "Video Slider Ads",
        src: "//aggressivestruggle.com/bUXaVasDd.GAlr0NYnWicN/PexmS9UuQZ/UIlgksPWT_YF2wOhTyMxxmN/DqQwtyN/jwYp5uMZznEK0/NjQl",
        delay: 0,
      },
      {
        id: "push-up",
        name: "Push Up Ads",
        src: "//aggressivestruggle.com/bbXDV.sadUGMlF0oYLW/cZ/ye/m/9muRZkUVljk/PpTrYo2/OtTzMgxeNkT_I/t_NLj/YI5oMuzbET1/M/wz",
        delay: 800,
      },
    ],
    []
  );

  /** Wrap triggerFallbacks in useCallback to stabilize reference */
  const triggerFallbacks = useCallback(() => {
    if (!isProduction || showFallbacks) return;
    console.warn("⚠️ Primary ad not visible — loading fallback ads");
    setShowFallbacks(true);
  }, [isProduction, showFallbacks]);

  /** Detect if the Social Bar appeared after 5s */
  useEffect(() => {
    if (!isProduction) return;

    const timer = setTimeout(() => {
      const adIframe = document.querySelector(
        "iframe[src*='effectivegatecpm'], iframe[src*='socialbar']"
      );
      if (!adIframe) {
        triggerFallbacks();
      } else {
        console.log("✅ Primary Social Bar detected in DOM");
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isProduction, triggerFallbacks]);

  /** Load fallback scripts when showFallbacks=true */
  useEffect(() => {
    if (!showFallbacks) return;

    fallbackAds.forEach((ad) => {
      setTimeout(() => {
        setFallbackScripts((prev) => [
          ...prev,
          <Script
            key={ad.id}
            id={ad.id}
            src={ad.src}
            strategy="afterInteractive"
            onLoad={() => console.log(`✅ Fallback loaded: ${ad.name}`)}
            onError={() =>
              console.error(`❌ Failed to load fallback: ${ad.name}`)
            }
          />,
        ]);
      }, ad.delay || 0);
    });
  }, [showFallbacks, fallbackAds]);

  if (!isProduction) return null;

  return (
    <>
      {/* Primary Social Bar Script */}
      <Script
        id="primary-social-bar"
        src={scriptSrc}
        strategy="afterInteractive"
        onLoad={() => {
          console.log("✅ Primary Social Bar script loaded");

          // Properly typed initialization
          const w = window as SocialBarWindow;
          if (w.SocialBar) {
            try {
              w.SocialBar.init?.({ siteId });
              console.log("✅ Social Bar initialized");
            } catch (e) {
              console.warn("⚠️ Social Bar initialization failed", e);
            }
          }
        }}
        onError={() => {
          console.error("❌ Primary Social Bar failed to load");
          triggerFallbacks();
        }}
      />

      {/* Render fallback scripts dynamically */}
      {fallbackScripts}
    </>
  );
}
