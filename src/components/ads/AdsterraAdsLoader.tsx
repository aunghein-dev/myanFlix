// components/ads/AdsLoader.tsx
'use client';
import Script from 'next/script';

export default function AdsterraAdsLoader() {
  const proxyUrl = '/api/ads/adsterra';

  return (
    <Script
      id="effective-gate-cpm-ad-script"
      src={proxyUrl}
      strategy="afterInteractive"
      referrerPolicy="no-referrer-when-downgrade"
      onLoad={() => {
        console.log('✅ Ad script loaded successfully via proxy.');
        

        setTimeout(() => {
          console.log('🔍 Checking for injected Adsterra elements...');
          
          const selectors = [
            '[class*="adsterra"]',
            '[id*="adsterra"]', 
            '[class*="effective"]',
            '[id*="effective"]',
            '[class*="gatecpm"]',
            '[id*="gatecpm"]',
            '.adsbyadsterra',
            '#adsbyadsterra'
          ];
          
          let adElement = null;
          for (const selector of selectors) {
            adElement = document.querySelector(selector);
            if (adElement) break;
          }
          
          if (adElement) {
            console.log('🟢 Ad element found in DOM!', adElement);
            console.log('📍 Ad location:', {
              tagName: adElement.tagName,
              id: adElement.id,
              className: adElement.className,
              parent: adElement.parentElement?.tagName
            });
          } else {
            console.warn('🟡 Ad script loaded but no ad element found. Possible reasons:');
            console.warn('   - Ad blocker extension');
            console.warn('   - No active campaigns');
            console.warn('   - Geographic restrictions');
            console.warn('   - Script loaded but not executed');
            
            // Additional check for iframes
            const iframes = document.querySelectorAll('iframe');
            console.log('🔍 Found iframes:', iframes.length);
            iframes.forEach((iframe, index) => {
              console.log(`   Iframe ${index}:`, iframe.src?.substring(0, 50) + '...');
            });
          }
        }, 2000);
      }}
      onError={(e) => {
        console.warn('❌ Ad script failed to load via proxy:', e);
        

        console.log('🔄 Attempting direct load as fallback...');
        const fallbackScript = document.createElement('script');
        fallbackScript.src = 'https://pl27965725.effectivegatecpm.com/9a/61/56/9a6156d154dc1851a1897a71a24d9eb2.js';
        fallbackScript.referrerPolicy = 'no-referrer-when-downgrade';
        fallbackScript.onload = () => console.log('✅ Direct fallback loaded');
        fallbackScript.onerror = (err) => console.warn('❌ Direct fallback also failed:', err);
        document.head.appendChild(fallbackScript);
      }}
    />
  );
}