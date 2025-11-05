"use client";

import { useEffect, useState } from "react";

interface SocialBarAdProps {
  scriptSrc?: string;
  position?: "auto" | "bottom-left" | "bottom-right" | "top-left" | "top-right";
  zIndex?: number;
}

export default function SocialBarAd({
  scriptSrc = "//pl27965725.effectivegatecpm.com/9a/61/56/9a6156d154dc1851a1897a71a24d9eb2.js",
  position = "auto",
  zIndex = 3000,
}: SocialBarAdProps) {
  const [autoPosition, setAutoPosition] = useState<
    "bottom-left" | "bottom-right" | "top-left" | "top-right"
  >("bottom-right");

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

  useEffect(() => {
    // Prevent duplicate script load
    if (document.querySelector(`script[src="${scriptSrc}"]`)) return;

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    script.type = "text/javascript";
    document.body.appendChild(script);

    return () => {
      // Optional: don't remove script in case provider needs it
      // document.body.removeChild(script);
    };
  }, [scriptSrc]);

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
