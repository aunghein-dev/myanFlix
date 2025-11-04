'use client';
import Script from 'next/script';

export default function AdsLoader() {
  return (
    <Script
      id="effective-gate-cpm-ad-script"
      src="//pl27965725.effectivegatecpm.com/9a/61/56/9a6156d154dc1851a1897a71a24d9eb2.js"
      strategy="afterInteractive"
      referrerPolicy="no-referrer-when-downgrade"
      onLoad={() => {
        console.log('✅ Ad script loaded via afterInteractive strategy!'); 
      }} 
    />
  );
}