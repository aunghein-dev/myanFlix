// components/ads/AdsLoader.tsx (Modified)

'use client';
import Script from 'next/script';

export default function AdsLoader() {
  return (
    <Script
      id="effective-gate-cpm-ad-script"
      src="https://pl27965725.effectivegatecpm.com/9a/61/56/9a6156d154dc1851a1897a71a24d9eb2.js"
      strategy="afterInteractive"
      referrerPolicy="no-referrer-when-downgrade"
      onLoad={() => {
          console.log('✅ Ad script loaded successfully by browser.');
          setTimeout(() => {
              console.log('Checking for injected Adsterra elements...');
              const adElement = document.querySelector('[class*="adsterra"], [id*="adsterra"]'); 
              if (adElement) {
                  console.log('🟢 Ad element found in DOM!', adElement);
              } else {
                  console.warn('🟡 Ad script loaded but no ad element found. Might be blocked or no campaign available.');
              }
          }, 1000); 
      }}
      onError={(e) => console.error('❌ Ad script failed to load:', e)}
    />
  );
}