// app/api/ads/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Allowed domains - ADD MEDIA DOMAINS
const ALLOWED_DOMAINS = [
  'aggressivestruggle.com',
  'euphoricreplacement.com',
  'silent-basis.pro', 
  'www.silent-basis.pro' 
];

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const fullPath = path.join('/');
  
  console.log('🔄 Ad proxy request for:', fullPath.substring(0, 100) + '...');

  // Extract domain and path from the full path
  let targetUrl: string;

  if (fullPath.startsWith('http')) {
    // Full URL provided
    targetUrl = fullPath;
  
  } else {
    // Relative path, prepend default domain
    targetUrl = `https://aggressivestruggle.com/${fullPath}`;
  }

  // Validate domain
  const targetDomain = new URL(targetUrl).hostname;
  const isAllowedDomain = ALLOWED_DOMAINS.some(domain => 
    targetDomain.includes(domain)
  );

  if (!isAllowedDomain) {
    console.warn('🚫 Blocked unauthorized domain:', targetDomain);
    return new NextResponse('// Domain not allowed', {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    console.log('📡 Fetching from:', targetUrl.substring(0, 100) + '...');

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.myanflix.top/',
        'Origin': 'https://www.myanflix.top',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        console.log('⚠️  Resource not found (404)');
        return new NextResponse('// Resource not available', {
          status: 200,
          headers: {
            'Content-Type': 'application/javascript',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
          },
        });
      }
      throw new Error(`HTTP ${response.status}`);
    }

    // Determine content type based on URL
    let contentType = response.headers.get('content-type');
    if (!contentType) {
      if (targetUrl.includes('.mp4') || targetUrl.includes('.webm') || targetUrl.includes('.flv')) {
        contentType = 'video/mp4';
      } else if (targetUrl.includes('.js')) {
        contentType = 'application/javascript';
      } else {
        contentType = 'text/plain';
      }
    }

    const data = await response.text();

    console.log('✅ Successfully proxied resource, length:', data.length);

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS, POST, HEAD',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range',
        'Cache-Control': 'public, max-age=1800',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error: unknown) {
    console.error('❌ Proxy error:', error);

    // For media files, return empty success to prevent errors
    if (targetUrl.includes('.mp4') || targetUrl.includes('.webm') || targetUrl.includes('.flv')) {
      return new NextResponse('', {
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new NextResponse('// Resource temporarily unavailable', {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, POST, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Range',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  // Handle HEAD requests for media validation
  const { path } = await context.params;
  const fullPath = path.join('/');
  
  console.log('📨 HEAD request for media validation:', fullPath.substring(0, 100));

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Content-Type': 'video/mp4',
    },
  });
}