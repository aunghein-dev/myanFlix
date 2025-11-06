import { NextRequest, NextResponse } from 'next/server';
import { checkForProxy, getClientIP } from '@/lib/proxy-checker';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const isProxy = await checkForProxy(ip);

    return NextResponse.json({
      ip,
      isProxy,
      redirectsTo: isProxy 
        ? 'https://heavenly-holiday.com/zAvjDd'
        : 'https://www.effectivegatecpm.com/xqij18jxsg?key=c3c280e305e2ea78f585e61716e4aa57',
      message: isProxy ? 'Proxy detected - redirecting to proxy URL' : 'No proxy - redirecting to normal URL'
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}