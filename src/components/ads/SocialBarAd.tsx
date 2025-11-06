"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

interface SocialBarAdProps {
  scriptSrc?: string;
}

interface FallbackAd {
  id: string;
  name: string;
  src: string;
  delay?: number;
}

export default function SocialBarAd({
  scriptSrc = "//pl27965725.effectivegatecpm.com/9a/61/56/9a6156d154dc1851a1897a71a24d9eb2.js",
}: SocialBarAdProps) {
  const [primaryFailed, setPrimaryFailed] = useState(false);
  const isProduction = true;

  const fallbackAds: FallbackAd[] = [
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
      delay: 1000,
    },
  ];

  useEffect(() => {
    if (!primaryFailed || !isProduction) return;

    console.warn("⚠️ Primary ad failed — loading fallbacks aggressively...");

    fallbackAds.forEach((ad) => {
      setTimeout(() => {
        if (!document.querySelector(`script[data-fallback="${ad.id}"]`)) {
          const script = document.createElement("script");
          script.src = ad.src;
          script.async = true;
          script.setAttribute("data-fallback", ad.id);
          script.referrerPolicy = "no-referrer-when-downgrade";
          document.body.appendChild(script);
          console.log(`✅ Loaded fallback ad: ${ad.name}`);
        }
      }, ad.delay || 0);
    });
  }, [primaryFailed]);

  if (!isProduction) return null;

  return (
    <>
      <Script
        id="primary-social-bar"
        src={scriptSrc}
        strategy="afterInteractive"
        onError={() => {
          console.error("❌ Primary Social Bar script failed");
          setPrimaryFailed(true);
        }}
        onLoad={() => console.log("✅ Primary Social Bar loaded successfully")}
      />
    </>
  );
}
