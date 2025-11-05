"use client";

import { useEffect, useState } from "react";

interface SocialBarAdProps {
  scriptSrc?: string;
  position?: "auto" | "bottom-left" | "bottom-right" | "top-left" | "top-right";
  zIndex?: number;
}

interface FallbackAd {
  id: string;
  name: string;
  script: string;
  delay?: number;
}

export default function SocialBarAd({
  scriptSrc = "//pl27965725.effectivegatecpm.com/9a/61/56/9a6156d154dc1851a1897a71a24d9eb2.js",
  position = "auto",
  zIndex = 3000,
}: SocialBarAdProps) {
  const [autoPosition, setAutoPosition] = useState<
    "bottom-left" | "bottom-right" | "top-left" | "top-right"
  >("bottom-right");
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded' | 'failed'>('idle');
  const [loadedFallbacks, setLoadedFallbacks] = useState<string[]>([]);


  const isProduction = true;

  // Fallback ad configurations
  const fallbackAds: FallbackAd[] = [
    {
      id: "video-slider",
      name: "Video Slider Ads",
      script: `(function(vaav){
        var d = document,
            s = d.createElement('script'),
            l = d.scripts[d.scripts.length - 1];
        s.settings = vaav || {};
        s.src = "//aggressivestruggle.com/bUXaVasDd.GAlr0NYnWicN/PexmS9UuQZ/UIlgksPWT_YF2wOhTyMxxmN/DqQwtyN/jwYp5uMZznEK0/NjQl";
        s.async = true;
        s.referrerPolicy = 'no-referrer-when-downgrade';
        l.parentNode.insertBefore(s, l);
      })({})`,
      delay: 0
    },
    {
      id: "push-up",
      name: "Push Up Ads", 
      script: `(function(bfvkjqx){
        var d = document,
            s = d.createElement('script'),
            l = d.scripts[d.scripts.length - 1];
        s.settings = bfvkjqx || {};
        s.src = "//aggressivestruggle.com/bbXDV.sadUGMlF0oYLW/cZ/ye/m/9muRZkUVljk/PpTrYo2/OtTzMgxeNkT_I/t_NLj/YI5oMuzbET1/M/wz";
        s.async = true;
        s.referrerPolicy = 'no-referrer-when-downgrade';
        l.parentNode.insertBefore(s, l);
      })({})`,
      delay: 1000
    }
  ];

  useEffect(() => {
    if (position === "auto") {
      const prefersTop = window.innerHeight < 600;
      const prefersLeft = window.innerWidth < 700;

      const pos =
        prefersTop && prefersLeft
          ? "top-left"
          : prefersTop
          ? "top-right"
          : prefersLeft
          ? "bottom-left"
          : "bottom-right";

      setAutoPosition(pos);
    }
  }, [position]);

  // Load primary ad script - ONLY IN PRODUCTION
  useEffect(() => {
    // Don't load ads in development
    if (!isProduction) {
      console.log("🛑 Ads disabled in development mode");
      return;
    }

    setLoadState('loading');

    // Prevent duplicate script load
    if (document.querySelector(`script[src="${scriptSrc}"]`)) {
      setLoadState('loaded');
      return;
    }

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    script.type = "text/javascript";
    
    script.onload = () => {
      console.log("✅ Primary ad script loaded successfully");
      setLoadState('loaded');
    };
    
    script.onerror = () => {
      console.warn("❌ Primary ad script failed, loading fallbacks...");
      setLoadState('failed');
      loadFallbackAds();
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, [scriptSrc, isProduction]);

  // Load fallback ads sequentially - ONLY IN PRODUCTION
  const loadFallbackAds = () => {
    if (!isProduction) return;
    
    console.log("🔄 Loading fallback ads...");
    
    fallbackAds.forEach((ad) => {
      setTimeout(() => {
        try {
          if (!document.querySelector(`script[data-fallback="${ad.id}"]`)) {
            const script = document.createElement("script");
            script.innerHTML = ad.script;
            script.async = true;
            script.setAttribute('data-fallback', ad.id);
            document.body.appendChild(script);
            
            setLoadedFallbacks(prev => [...prev, ad.id]);
            console.log(`✅ Fallback ad loaded: ${ad.name}`);
          }
        } catch (error) {
          console.error(`❌ Failed to load fallback ad ${ad.name}:`, error);
        }
      }, ad.delay || 0);
    });
  };

  // Auto position handling
  useEffect(() => {
    if (position !== "auto") return;

    const handleResize = () => {
      const prefersTop = window.innerHeight < 600;
      const prefersLeft = window.innerWidth < 700;

      const pos =
        prefersTop && prefersLeft
          ? "top-left"
          : prefersTop
          ? "top-right"
          : prefersLeft
          ? "bottom-left"
          : "bottom-right";

      setAutoPosition(pos);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [position]);

  // Don't render anything in development
  if (!isProduction) {
    return null;
  }

  const pos = position === "auto" ? autoPosition : position;

  const positionStyles: Record<string, string> = {
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
  };

  return (
    <div
      className={`fixed ${positionStyles[pos]}`}
      style={{ zIndex }}
    />
  );
}