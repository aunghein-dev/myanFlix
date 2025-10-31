"use client";

import { useState } from "react";
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
  const [retrySrc, setRetrySrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  const handleError = () => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount((c) => c + 1);
      setRetrySrc(`${src}?retry=${Date.now()}`);
    } else {
      setRetrySrc("/no-image.png");
    }
  };

  return fill ? (
    <Image
      fill
      unoptimized={unoptimized}
      src={retrySrc}
      alt={alt}
      onError={handleError}
      className={className}
    />
  ) : (
    <Image
      width={width}
      height={height}
      unoptimized={unoptimized}
      src={retrySrc}
      alt={alt}
      onError={handleError}
      className={className}
    />
  );
}
