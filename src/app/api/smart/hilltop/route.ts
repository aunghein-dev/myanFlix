import { NextResponse } from "next/server";

export async function GET() {
  const targetUrl = "https://heavenly-holiday.com/zAvjDd";
  return NextResponse.redirect(targetUrl);
}