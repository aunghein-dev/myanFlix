import { NextRequest, NextResponse } from "next/server";
import { checkForProxy, getClientIP } from '@/lib/proxy-checker';

const EXEIO_API_TOKEN = process.env.NEXT_PUBLIC_EXEIO_API_TOKEN!;
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

    if (!isProxy) {
      
      // PROXY USERS!: ShrinkEarn primary, Exe.io fallback
      try {
        shortUrl = await shortenWithShrinkEarn(originalUrl, safeAlias);
        provider = 'shrinkearn.com';
        attempts.push({ provider, status: 'success', reason: 'proxy_user_primary' });
      } catch (err) {
        attempts.push({ provider: 'shrinkearn.com', status: 'failed', error: String(err) });
        try {
          shortUrl = await shortenWithExeIo(originalUrl, safeAlias);
          provider = 'exe.io';
          attempts.push({ provider, status: 'success', reason: 'proxy_fallback' });
        } catch (exeErr) {
          attempts.push({ provider: 'exe.io', status: 'failed', error: String(exeErr) });
          throw new Error('All services failed for proxy user');
        }
      }
    } else {
      // DIRECT USERS!: Exe.io primary, ShrinkEarn fallback
      try {
        shortUrl = await shortenWithExeIo(originalUrl, safeAlias);
        provider = 'exe.io';
        attempts.push({ provider, status: 'success', reason: 'direct_user_primary' });
      } catch (err) {
        attempts.push({ provider: 'exe.io', status: 'failed', error: String(err) });
        try {
          shortUrl = await shortenWithShrinkEarn(originalUrl, safeAlias);
          provider = 'shrinkearn.com';
          attempts.push({ provider, status: 'success', reason: 'direct_fallback' });
        } catch (shrinkErr) {
          attempts.push({ provider: 'shrinkearn.com', status: 'failed', error: String(shrinkErr) });
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
      cpmStrategy: isProxy ? 'shrinkearn_primary' : 'exeio_primary'
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

// ShrinkEarn Shortener
async function shortenWithShrinkEarn(url: string, alias?: string): Promise<string> {
  const apiUrl = new URL("https://shrinkearn.com/api");
  apiUrl.searchParams.set("api", SHRINKEARN_API_TOKEN);
  apiUrl.searchParams.set("url", url);
  if (alias) apiUrl.searchParams.set("alias", alias);
  apiUrl.searchParams.set("format", "json");

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

// Exe.io Shortener
async function shortenWithExeIo(url: string, alias?: string): Promise<string> {
  const apiUrl = new URL("https://exe.io/api");
  apiUrl.searchParams.set("api", EXEIO_API_TOKEN);
  apiUrl.searchParams.set("url", url);
  if (alias) apiUrl.searchParams.set("alias", alias);
  apiUrl.searchParams.set("format", "json");

  const response = await fetch(apiUrl.toString(), { cache: "no-store" });
  if (!response.ok) throw new Error(`Exe.io API HTTP error: ${response.status}`);
  const data = await response.json();
  if (data.status !== "success" || !data.shortenedUrl) {
    throw new Error(data.message || "Exe.io returned error status");
  }

  return data.shortenedUrl;
}
