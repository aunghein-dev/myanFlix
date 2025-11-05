"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface GlobalImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  unoptimized?: boolean;
}

export default function GlobalImage({
  src,
  alt,
  className,
  width,
  height,
  fill = false,
  unoptimized = true,
}: GlobalImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  // Reset when src prop changes
  useEffect(() => {
    setCurrentSrc(src);
    setRetryCount(0);
  }, [src]);

  const handleError = () => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount((c) => c + 1);
      setCurrentSrc(`${src}?retry=${Date.now()}`);
    } else {
      setCurrentSrc("/no-image.png");
    }
  };

  return fill ? (
    <Image
      fill
      unoptimized={unoptimized}
      src={currentSrc}
      alt={alt}
      onError={handleError}
      className={className}
    />
  ) : (
    <Image
      width={width}
      height={height}
      unoptimized={unoptimized}
      src={currentSrc}
      alt={alt}
      onError={handleError}
      className={className}
    />
  );
}