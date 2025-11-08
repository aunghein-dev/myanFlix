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
  onLoadingComplete?: () => void; 
}

export default function GlobalImage({
  src,
  alt,
  className,
  width,
  height,
  fill = false,
  unoptimized = true,
  onLoadingComplete,
}: GlobalImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  useEffect(() => {
    setCurrentSrc(src);
    setRetryCount(0);
  }, [src]);

  const handleError = () => {
    if (retryCount < MAX_RETRIES) {
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
      // Fallback for TMDB proxy
      if (src.includes('/api/tmdb-image/')) {
        const tmdbPath = src.replace('/api/tmdb-image/', '');
        const directUrl = `https://image.tmdb.org/t/p/${tmdbPath}`;
        setCurrentSrc(directUrl);
      } else {
        const separator = src.includes('?') ? '&' : '?';
        setCurrentSrc(`${src}${separator}retry=${Date.now()}`);
      }
    } else {
      setCurrentSrc("/no-image.png");
    }
  };

  const handleLoadComplete = () => {
    if (onLoadingComplete) onLoadingComplete();
  };

  return fill ? (
    <Image
      fill
      unoptimized={unoptimized}
      src={currentSrc}
      alt={alt}
      onError={handleError}
      onLoadingComplete={handleLoadComplete}
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
      onLoadingComplete={handleLoadComplete}
      className={className}
    />
  );
}
