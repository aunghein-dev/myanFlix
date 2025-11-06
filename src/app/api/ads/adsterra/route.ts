// app/api/ads/adsterra/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const targetUrl = 'https://pl27965725.effectivegatecpm.com/9a/61/56/9a6156d154dc1851a1897a71a24d9eb2.js';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    console.log('🔄 Fetching Adsterra script from:', targetUrl);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.myanflix.top/',
        'Sec-Fetch-Dest': 'script',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'application/javascript';
    const scriptContent = await response.text();

    console.log('✅ Adsterra script fetched successfully, length:', scriptContent.length);

    // Create response with CORS headers
    const nextResponse = new NextResponse(scriptContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=1800', 
        'X-Content-Type-Options': 'nosniff',
        'Vary': 'Origin',
      },
    });

    return nextResponse;

  } catch (error: unknown) {
    console.error('❌ Adsterra proxy fetch failed:', error);

    // Return a fallback script that attempts to load the ad directly
    const fallbackScript = `
      console.log('🔄 Using fallback Adsterra loader...');
      (function() {
        var script = document.createElement('script');
        script.src = '${targetUrl}';
        script.referrerPolicy = 'no-referrer-when-downgrade';
        script.onload = function() {
          console.log('✅ Adsterra script loaded via fallback method');
          setTimeout(function() {
            var adElement = document.querySelector('[class*="adsterra"], [id*="adsterra"], [class*="effective"], [id*="effective"]');
            if (adElement) {
              console.log('🟢 Ad element found via fallback:', adElement);
            } else {
              console.warn('🟡 Fallback loaded but no ad element detected');
            }
          }, 2000);
        };
        script.onerror = function(e) {
          console.warn('❌ Fallback ad script failed:', e);
        };
        document.head.appendChild(script);
      })();
    `;

    return new NextResponse(fallbackScript, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}