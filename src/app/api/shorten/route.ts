import { NextRequest, NextResponse } from "next/server";
import { checkForProxy, getClientIP } from '@/lib/proxy-checker';

const SHRINKME_API_TOKEN = process.env.NEXT_PUBLIC_SHRINKME_API_TOKEN!;
const SHRINKEARN_API_TOKEN = process.env.NEXT_PUBLIC_SHRINKEARN_API_TOKEN!;

export async function POST(req: NextRequest) {
  let originalUrl: string | null = null;

  try {
    const { url, alias } = await req.json();
    originalUrl = url;

    if (!originalUrl) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    const ip = getClientIP(req);
    const isProxy = await checkForProxy(ip);

    const safeAlias = alias ? alias.replace(/[^a-zA-Z0-9-_]/g, "_") : undefined;

    console.log(`Shortening for IP: ${ip}, Proxy: ${isProxy}`);

    let provider;
    let shortUrl;
    const attempts = [];

    if (isProxy) {
      // PROXY USERS: ShrinkMe.io first
      try {
        shortUrl = await shortenWithShrinkMe(originalUrl, safeAlias);
        provider = 'shrinkme.io';
        attempts.push({ provider: 'shrinkme.io', status: 'success', reason: 'proxy_user_high_cpm' });
      } catch (error) {
        attempts.push({ provider: 'shrinkme.io', status: 'failed', error: String(error) });
        // Fallback to ShrinkEarn for proxy users
        try {
          shortUrl = await shortenWithShrinkEarn(originalUrl, safeAlias);
          provider = 'shrinkearn.com';
          attempts.push({ provider: 'shrinkearn.com', status: 'success', reason: 'proxy_fallback' });
        } catch (shrinkEarnError) {
          attempts.push({ provider: 'shrinkearn.com', status: 'failed', error: String(shrinkEarnError) });
          throw new Error('All services failed for proxy user');
        }
      }
    } else {
      // DIRECT USERS: ShrinkEarn primary
      try {
        shortUrl = await shortenWithShrinkEarn(originalUrl, safeAlias);
        provider = 'shrinkearn.com';
        attempts.push({ provider: 'shrinkearn.com', status: 'success', reason: 'direct_user_primary' });
      } catch (error) {
        attempts.push({ provider: 'shrinkearn.com', status: 'failed', error: String(error) });
        // Fallback to ShrinkMe.io
        try {
          shortUrl = await shortenWithShrinkMe(originalUrl, safeAlias);
          provider = 'shrinkme.io';
          attempts.push({ provider: 'shrinkme.io', status: 'success', reason: 'direct_fallback' });
        } catch (shrinkMeError) {
          attempts.push({ provider: 'shrinkme.io', status: 'failed', error: String(shrinkMeError) });
          throw new Error('All services failed for direct user');
        }
      }
    }

    return NextResponse.json({
      shortUrl,
      status: "success",
      provider,
      clientIp: ip,
      isProxy,
      attempts,
      cpmStrategy: isProxy ? 'shrinkme_high_cpm' : 'shrinkearn_primary'
    });

  } catch (err) {
    console.error("All shortening services failed:", err);
    return NextResponse.json(
      { 
        error: "All shortening services failed",
        details: String(err),
        fallbackUrl: originalUrl
      },
      { status: 503 }
    );
  }
}

// ShrinkMe.io shortener
async function shortenWithShrinkMe(url: string, alias?: string): Promise<string> {
  const apiUrl = new URL("https://shrinkme.io/api");
  apiUrl.searchParams.set("api", SHRINKME_API_TOKEN);
  apiUrl.searchParams.set("url", url);
  if (alias) apiUrl.searchParams.set("alias", alias);
  apiUrl.searchParams.set("format", "json");

  const response = await fetch(apiUrl.toString(), {
    method: 'GET',
    cache: "no-store",
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) throw new Error(`ShrinkMe.io API HTTP error: ${response.status}`);

  const data = await response.json();
  if (data.status !== "success" || !data.shortenedUrl) {
    throw new Error(data.message || "ShrinkMe.io returned error status");
  }

  return data.shortenedUrl;
}

// ShrinkEarn shortener
async function shortenWithShrinkEarn(url: string, alias?: string): Promise<string> {
  const apiUrl = new URL("https://shrinkearn.com/api");
  apiUrl.searchParams.set("api", SHRINKEARN_API_TOKEN);
  apiUrl.searchParams.set("url", url);
  if (alias) apiUrl.searchParams.set("alias", alias);
  apiUrl.searchParams.set("format", "json"); // JSON response

  const response = await fetch(apiUrl.toString(), {
    method: 'GET',
    cache: "no-store",
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) throw new Error(`ShrinkEarn API HTTP error: ${response.status}`);

  const data = await response.json();
  if (data.status !== "success" || !data.shortenedUrl) {
    throw new Error(data.message || "ShrinkEarn returned error status");
  }

  return data.shortenedUrl;
}


/*import { NextRequest, NextResponse } from "next/server";
import { checkForProxy, getClientIP } from '@/lib/proxy-checker';

const EXEIO_API_TOKEN = process.env.NEXT_PUBLIC_EXEIO_API_TOKEN!;
const SHRINKME_API_TOKEN = process.env.NEXT_PUBLIC_SHRINKME_API_TOKEN!;

export async function POST(req: NextRequest) {
  // Declare url variable outside try block to make it accessible in catch
  let originalUrl: string | null = null;

  try {
    const { url, alias } = await req.json();
    originalUrl = url; // Store for potential fallback

    if (!originalUrl) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    // Get client IP and proxy status
    const ip = getClientIP(req);
    const isProxy = await checkForProxy(ip);
    
    // Sanitize alias
    const safeAlias = alias ? alias.replace(/[^a-zA-Z0-9-_]/g, "_") : undefined;

    console.log(`Shortening for IP: ${ip}, Proxy: ${isProxy}`);

    // Smart Provider Strategy:
    // - Proxy users: ShrinkMe.io (higher CPM)
    // - Direct users: exe.io (primary), ShrinkMe.io (fallback)
    let provider;
    let shortUrl;
    const attempts = [];

    if (isProxy) {
      // PROXY USERS: Use ShrinkMe.io for highest CPM
      try {
        shortUrl = await shortenWithShrinkMe(originalUrl, safeAlias);
        provider = 'shrinkme.io';
        attempts.push({ provider: 'shrinkme.io', status: 'success', reason: 'proxy_user_high_cpm' });
      } catch (error) {
        attempts.push({ provider: 'shrinkme.io', status: 'failed', error: String(error) });
        // Fallback to exe.io for proxy users (might fail but we try)
        try {
          shortUrl = await shortenWithExeIo(originalUrl, safeAlias);
          provider = 'exe.io';
          attempts.push({ provider: 'exe.io', status: 'success', reason: 'proxy_fallback' });
        } catch (exeError) {
          attempts.push({ provider: 'exe.io', status: 'failed', error: String(exeError) });
          throw new Error('All services failed for proxy user');
        }
      }
    } else {
      // DIRECT USERS: Use exe.io first, ShrinkMe.io as fallback
      try {
        shortUrl = await shortenWithExeIo(originalUrl, safeAlias);
        provider = 'exe.io';
        attempts.push({ provider: 'exe.io', status: 'success', reason: 'direct_user_primary' });
      } catch (error) {
        attempts.push({ provider: 'exe.io', status: 'failed', error: String(error) });
        // Fallback to ShrinkMe.io for direct users
        try {
          shortUrl = await shortenWithShrinkMe(originalUrl, safeAlias);
          provider = 'shrinkme.io';
          attempts.push({ provider: 'shrinkme.io', status: 'success', reason: 'direct_fallback' });
        } catch (shrinkError) {
          attempts.push({ provider: 'shrinkme.io', status: 'failed', error: String(shrinkError) });
          throw new Error('All services failed for direct user');
        }
      }
    }

    return NextResponse.json({
      shortUrl,
      status: "success",
      provider,
      clientIp: ip,
      isProxy,
      attempts,
      cpmStrategy: isProxy ? 'shrinkme_high_cpm' : 'exeio_primary'
    });

  } catch (err) {
    console.error("All shortening services failed:", err);
    return NextResponse.json(
      { 
        error: "All shortening services failed",
        details: String(err),
        fallbackUrl: originalUrl // Now accessible
        
      },
      { status: 503 }
    );
  }
}

// ShrinkMe.io Shortener - Higher CPM for Proxy Users
async function shortenWithShrinkMe(url: string, alias?: string): Promise<string> {
  const apiUrl = new URL("https://shrinkme.io/api");
  apiUrl.searchParams.set("api", SHRINKME_API_TOKEN);
  apiUrl.searchParams.set("url", url);
  if (alias) apiUrl.searchParams.set("alias", alias);
  apiUrl.searchParams.set("format", "json");

  const response = await fetch(apiUrl.toString(), {
    method: 'GET',
    cache: "no-store",
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`ShrinkMe.io API HTTP error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== "success" || !data.shortenedUrl) {
    throw new Error(data.message || "ShrinkMe.io returned error status");
  }

  return data.shortenedUrl;
}

// exe.io Shortener - Primary for Direct Users
async function shortenWithExeIo(url: string, alias?: string): Promise<string> {
  const apiUrl = new URL("https://exe.io/api");
  apiUrl.searchParams.set("api", EXEIO_API_TOKEN);
  apiUrl.searchParams.set("url", url);
  if (alias) apiUrl.searchParams.set("alias", alias);
  apiUrl.searchParams.set("format", "json");

  const response = await fetch(apiUrl.toString(), { 
    cache: "no-store",
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`exe.io API HTTP error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== "success" || !data.shortenedUrl) {
    throw new Error(data.message || "exe.io returned error status");
  }

  return data.shortenedUrl;
}
*/

