// app/api/tmdb-image/[...path]/route.ts
import { NextResponse } from "next/server";

interface Context {
  params: Promise<{ path: string[] }>;
}

// Use a reliable proxy service that works in Myanmar
const PROXY_SERVICES = [
  // Free proxies that often work
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://proxy.cors.sh/?',
];

async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Try direct first
      if (attempt === 0) {
        const directResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          }
        });
        if (directResponse.ok) return directResponse;
      }
      
      // Try proxies
      const proxyIndex = attempt % PROXY_SERVICES.length;
      const proxyUrl = PROXY_SERVICES[proxyIndex] + encodeURIComponent(url);
      
      const response = await fetch(proxyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...(proxyUrl.includes('cors.sh') && process.env.CORS_SH_TOKEN ? {
            'x-cors-api-key': process.env.CORS_SH_TOKEN
          } : {})
        }
      });
      
      if (response.ok) return response;
      
    } catch (error) {
      console.log(`Attempt ${attempt + 1} failed:`, error);
      if (attempt === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw new Error('All attempts failed');
}

export async function GET(req: Request, context: Context) {
  try {
    const params = await context.params;
    const path = params.path;

    if (!path || path.length < 2) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const size = path[0];
    let filename = path.slice(1).join("/");

    // Remove query parameters from filename
    if (filename.includes('?')) {
      filename = filename.split('?')[0];
    }

    // Enhanced validation
    if (!filename || 
        filename.toLowerCase() === "null" || 
        filename.toLowerCase() === "undefined" ||
        !filename.includes('.') ||
        filename.length < 3) {
      return NextResponse.json({ error: "Invalid image path" }, { status: 400 });
    }

    // Validate size parameter
    const validSizes = ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'w200', 'w300', 'original'];
    if (!validSizes.includes(size)) {
      return NextResponse.json({ error: "Invalid size parameter" }, { status: 400 });
    }

    const tmdbUrl = `https://image.tmdb.org/t/p/${size}/${filename}`;

    try {
      const response = await fetchWithRetry(tmdbUrl);
      
      if (!response.ok) {
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      const imageBuffer = await response.arrayBuffer();

      return new NextResponse(imageBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=2592000", // 30 days
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (fetchError) {
      console.error("All fetch attempts failed:", fetchError);
      return NextResponse.json({ 
        error: "Unable to fetch image from TMDB",
        message: "Service temporarily unavailable in your region"
      }, { status: 502 });
    }

  } catch (err) {
    console.error("TMDB Proxy Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}