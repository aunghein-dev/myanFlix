// components/SafeAdLoader.tsx
'use client';
import { useAdInterceptor } from '@/hook/useAdInterceptor';
import { useEffect, useState } from 'react';


interface AdConfig {
  id: string;
  path: string;
  name: string;
  priority: 'high' | 'medium' | 'low' | 'verylow';
  fallbackScript?: string;
}

const AD_CONFIGS: AdConfig[] = [
  {
    id: 'hilltop-pushup',
    path: 'bYX.VcsQdfG/lS0FY/Wicp/LeOmx9LuDZFUOlBktPBTOYN2kO/TDMixDNnTjIttSN/joYU5qMZzrEB1kMPwL',
    name: 'Push-up Ad',
    priority: 'verylow',
    fallbackScript: `(function(lnoe){var d=document,s=d.createElement('script'),l=d.scripts[d.scripts.length-1];s.settings=lnoe||{};s.src="//aggressivestruggle.com/bYX.VcsQdfG/lS0FY/Wicp/LeOmx9LuDZFUOlBktPBTOYN2kO/TDMixDNnTjIttSN/joYU5qMZzrEB1kMPwL";s.async=true;s.referrerPolicy='no-referrer-when-downgrade';l.parentNode.insertBefore(s,l);})({})`
  },
  {
    id: 'hilltop-video-slider', 
    path: 'b.XHVHs/dcGslp0NYXWzcO/ge/me9VuOZCUelFkDPuTwY-2IOFTYMfxrNKD/QatJNYjMY/5-MYz/Ey0MNYQ-',
    name: 'Video Slider',
    priority: 'low',
    fallbackScript: `(function(mkdx){var d=document,s=d.createElement('script'),l=d.scripts[d.scripts.length-1];s.settings=mkdx||{};s.src="//aggressivestruggle.com/b.XHVHs/dcGslp0NYXWzcO/ge/me9VuOZCUelFkDPuTwY-2IOFTYMfxrNKD/QatJNYjMY/5-MYz/Ey0MNYQ-";s.async=true;s.referrerPolicy='no-referrer-when-downgrade';l.parentNode.insertBefore(s,l);})({})`
  }
];

export default function HilltopAdsLoader() {
  const [loadedAds, setLoadedAds] = useState<Set<string>>(new Set());
  useAdInterceptor(); // Enable request interception

  useEffect(() => {
    const injectAdScript = (config: AdConfig): Promise<boolean> => {
      return new Promise((resolve) => {
        // Clean up any existing script first
        const existingScript = document.getElementById(config.id);
        if (existingScript) {
          existingScript.remove();
        }

        const script = document.createElement('script');
        script.id = config.id;
        script.src = `/api/ads/${config.path}`;
        script.async = true;
        script.referrerPolicy = 'no-referrer-when-downgrade';
        
        script.onload = () => {
          console.log(`✅ ${config.name} loaded via proxy`);
          setLoadedAds(prev => new Set(prev).add(config.id));
          resolve(true);
        };
        
        script.onerror = () => {
          console.warn(`⚠️ ${config.name} proxy failed, using direct fallback`);
          
          // Use direct fallback script
          if (config.fallbackScript) {
            const fallbackScript = document.createElement('script');
            fallbackScript.innerHTML = config.fallbackScript;
            fallbackScript.onerror = () => console.warn(`❌ ${config.name} direct fallback also failed`);
            document.head.appendChild(fallbackScript);
          }
          
          resolve(false);
        };
        
        document.head.appendChild(script);
      });
    };

    const loadAdsSequentially = async () => {
      // Sort by priority
      const sortedAds = [...AD_CONFIGS].sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2, verylow: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      for (const adConfig of sortedAds) {
        try {
          await injectAdScript(adConfig);
          // Wait between ad loads
          await new Promise(resolve => setTimeout(resolve, 4000));
        } catch (error) {
          console.warn(`🚫 Failed to load ${adConfig.name}:`, error);
        }
      }

      // Monitor for ad elements after all scripts loaded
      setTimeout(() => {
        console.log('🔍 Checking for ad elements...');
        const adElements = document.querySelectorAll('[class*="ad"], [id*="ad"], iframe');
        console.log(`📊 Found ${adElements.length} potential ad elements`);
      }, 7000);
    };

    // Start loading after a brief delay
    const timer = setTimeout(() => {
      console.log('🎯 Starting HilltopAds loading sequence...');
      loadAdsSequentially();
    }, 3500);

    return () => {
      clearTimeout(timer);
      // Cleanup on unmount
      AD_CONFIGS.forEach(config => {
        const script = document.getElementById(config.id);
        if (script) script.remove();
      });
    };
  }, []);

  return (
    <div style={{ display: 'none' }} data-ad-loader-status={`Loaded: ${loadedAds.size}/${AD_CONFIGS.length}`}>
      {/* Hidden container for ad status */}
    </div>
  );
}