import { NextResponse } from "next/server";

export async function GET() {
  const targetUrl = "https://www.effectivegatecpm.com/xqij18jxsg?key=c3c280e305e2ea78f585e61716e4aa57";
  return NextResponse.redirect(targetUrl);
}