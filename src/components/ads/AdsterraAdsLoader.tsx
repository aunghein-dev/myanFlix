'use client';
import Script from 'next/script';

export default function AdsterraLoader() {
  return (
    <Script
      id="adsterra-social-bar"
      src="//pl27965725.effectivegatecpm.com/9a/61/56/9a6156d154dc1851a1897a71a24d9eb2.js"
      strategy="afterInteractive"
      async
      onLoad={() => console.log('✅ Adsterra Social Bar loaded')}
      onError={(e) => console.error('❌ Failed to load Adsterra Social Bar:', e)}
    />
  );
}
