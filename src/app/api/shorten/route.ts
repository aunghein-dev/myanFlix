import { NextRequest, NextResponse } from "next/server";

const ADFLY_API_TOKEN = process.env.NEXT_PUBLIC_ADFLY_API_TOKEN!;

export async function POST(req: NextRequest) {
  try {
    const { url, alias } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    // Sanitize alias: only letters, numbers, dash, underscore
    const safeAlias = alias
      ? alias.replace(/[^a-zA-Z0-9-_]/g, "_")
      : undefined;

    const apiUrl = new URL("https://adfly.site/api");
    apiUrl.searchParams.set("api", ADFLY_API_TOKEN);
    apiUrl.searchParams.set("url", url);
    if (safeAlias) apiUrl.searchParams.set("alias", safeAlias);
    apiUrl.searchParams.set("format", "json");

    const response = await fetch(apiUrl.toString());
    const data = await response.json();

    if (data.status !== "success") {
      return NextResponse.json({ error: data.message || "Failed to shorten URL" }, { status: 500 });
    }

    return NextResponse.json({ shortUrl: data.shortenedUrl });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}
