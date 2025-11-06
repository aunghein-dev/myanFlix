// hooks/useAdInterceptor.ts
import { useEffect } from 'react';

// Configuration - ADD MEDIA DOMAINS
const AD_DOMAINS = [
  'aggressivestruggle.com', 
  'euphoricreplacement.com',
  'silent-basis.pro' 
];

const PROXY_BASE = '/api/ads';

// Type-safe XHR interceptor with enhanced error handling
export const useAdInterceptor = () => {
  useEffect(() => {
    // Store references to original implementations
    const OriginalXHR = window.XMLHttpRequest;
    const originalFetch = window.fetch;

    // Helper function to check if URL should be intercepted
    const shouldIntercept = (url: string): boolean => {
      return AD_DOMAINS.some(domain => url.includes(domain));
    };

    // Helper function to create proxy URL
    const createProxyUrl = (originalUrl: string): string => {
      return `${PROXY_BASE}/${encodeURIComponent(originalUrl)}`;
    };

    // Subclass XMLHttpRequest for type safety
    class InterceptedXHR extends OriginalXHR {
      private isAdRequest: boolean = false;

      open(
        method: string,
        url: string | URL,
        async: boolean = true,
        username?: string | null,
        password?: string | null
      ): void {
        const urlString = url.toString();
        this.isAdRequest = shouldIntercept(urlString);

        if (this.isAdRequest) {
          const proxyUrl = createProxyUrl(urlString);
          console.log('🔄 Intercepting XHR:', method, urlString.substring(0, 80));
          super.open(method, proxyUrl, async, username, password);
        } else {
          super.open(method, url, async, username, password);
        }
      }

      send(body?: Document | XMLHttpRequestBodyInit | null): void {
        // Only add error handlers for ad requests
        if (this.isAdRequest) {
          this.addEventListener('error', (event) => {
            console.warn('❌ Ad XHR failed (silenced)', event);
          });

          this.addEventListener('timeout', (event) => {
            console.warn('⏰ Ad XHR timeout (silenced)', event);
          });

          this.addEventListener('load', () => {
            if (this.status >= 400) {
              console.warn(`⚠️ Ad XHR completed with status ${this.status} (silenced)`);
            }
          });
        }

        super.send(body);
      }
    }

    // Intercept fetch requests
    const interceptedFetch: typeof window.fetch = async function(
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const url = typeof input === 'string' 
        ? input 
        : input instanceof URL 
          ? input.toString() 
          : input.url;

      if (shouldIntercept(url)) {
        const proxyUrl = createProxyUrl(url);
        console.log('🔄 Intercepting fetch:', url.substring(0, 80));

        try {
          if (input instanceof Request) {
            return await originalFetch(proxyUrl, {
              method: input.method,
              headers: input.headers,
              body: input.body,
              referrer: input.referrer,
              referrerPolicy: input.referrerPolicy,
              mode: 'cors',
              credentials: input.credentials,
              cache: input.cache,
              redirect: input.redirect,
              integrity: input.integrity,
              keepalive: input.keepalive,
              signal: input.signal,
              ...init
            });
          }
          
          return await originalFetch(proxyUrl, {
            ...init,
            mode: 'cors'
          });
        } catch (error) {
          console.warn('❌ Ad fetch failed (silenced)', error);
          // Return a mock response to prevent errors
          return new Response('', { 
            status: 200, 
            statusText: 'OK',
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      }

      return originalFetch(input, init);
    };

    // Replace global functions
    window.XMLHttpRequest = InterceptedXHR;
    window.fetch = interceptedFetch;

    return () => {
      // Restore original implementations on cleanup
      window.XMLHttpRequest = OriginalXHR;
      window.fetch = originalFetch;
    };
  }, []);
};