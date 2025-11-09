// components/ads/AdsterraLoader.tsx
'use client';
import Script from 'next/script';

export default function AdsterraLoader() {
  return (
    <Script
      id="adsterra-script"
      src="https://pl27965725.effectivegatecpm.com/9a/61/56/9a6156d154dc1851a1897a71a24d9eb2.js"
      strategy="afterInteractive"
      async
      crossOrigin="anonymous"
      referrerPolicy="no-referrer-when-downgrade"
      onLoad={() => {
        console.log('✅ Adsterra script loaded successfully.');
      }}
      onError={(e) => {
        console.warn('❌ Failed to load Adsterra script:', e);
      }}
    />
  );
}
