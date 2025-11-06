export async function checkForProxy(ip: string): Promise<boolean> {
  try {
    // Method 1: Try ip-api.com first
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,proxy,hosting`);
    const data = await response.json();

    if (data.status === "success") {
      // If proxy or hosting is detected, return true
      if (data.proxy || data.hosting) {
        return true;
      }
    }

    // Method 2: Additional check with ipapi.co for suspicious ISPs
    try {
      const ipapiResponse = await fetch(`https://ipapi.co/${ip}/json/`);
      const ipapiData = await ipapiResponse.json();

      if (ipapiData && !ipapiData.error) {
        const isSuspiciousISP = 
          ipapiData.org?.toLowerCase().includes('vpn') ||
          ipapiData.org?.toLowerCase().includes('proxy') ||
          ipapiData.org?.toLowerCase().includes('hosting') ||
          ipapiData.asn?.toLowerCase().includes('vpn');

        if (isSuspiciousISP) {
          return true;
        }
      }
    } catch (error) {
      // Continue if this service fails
      console.log('ipapi.co check failed, continuing...', error);
    }

    // If no proxy detected, return false
    return false;
  } catch (error) {
    console.error('Proxy check failed:', error);
    return false; // Default to false on error
  }
}

export function getClientIP(req: Request): string {
  const headers = req.headers;
  
  const getHeaderValue = (headerName: string): string | null => {
    const value = headers.get(headerName);
    return value ? value.trim() : null;
  };

  const forwardedFor = getHeaderValue('x-forwarded-for');
  const realIP = getHeaderValue('x-real-ip');
  const clientIP = getHeaderValue('x-client-ip');

  let ip: string;

  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim()).filter(ip => ip.length > 0);
    ip = ips[0] || '8.8.8.8';
  } else if (realIP) {
    ip = realIP;
  } else if (clientIP) {
    ip = clientIP;
  } else {
    ip = '8.8.8.8';
  }

  const localhostIPs = new Set(['::1', '127.0.0.1', 'localhost']);
  if (localhostIPs.has(ip.toLowerCase())) {
    ip = '8.8.8.8';
  }

  return ip || '8.8.8.8';
}