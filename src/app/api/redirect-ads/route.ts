import { NextRequest, NextResponse } from 'next/server';
import { checkForProxy, getClientIP } from '@/lib/proxy-checker';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const isProxy = await checkForProxy(ip);

    const targetUrl = isProxy
      ? 'https://heavenly-holiday.com/zAvjDd'
      : 'https://www.effectivegatecpm.com/xqij18jxsg?key=c3c280e305e2ea78f585e61716e4aa57';


    const res = await fetch(targetUrl);
    const data = await res.text(); 

    return new Response(data, {
      headers: { 'Content-Type': res.headers.get('Content-Type') || 'text/html' },
    });
  } catch (error) {
    console.log(error);
    return NextResponse.redirect('https://www.effectivegatecpm.com/xqij18jxsg?key=c3c280e305e2ea78f585e61716e4aa57');
  }
}
