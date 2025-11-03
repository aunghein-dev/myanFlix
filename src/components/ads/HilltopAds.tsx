'use client';
import Script from 'next/script';

export default function HilltopAds() {
  return (
    <>
      <Script id="videoslider-ad" strategy="lazyOnload">
        {`
          (function(vsumm){
            var d = document,
                s = d.createElement('script'),
                l = d.scripts[d.scripts.length - 1];
            s.settings = vsumm || {};
            s.src = "//aggressivestruggle.com/b/XEV/s.daGfl/0FYUWVcA/ceimQ9RuUZOU/l_kePeTMYG2YODT/MCxqNHDsQftrN/jEYd5GMWz/E/0WNHQC";
            s.async = true;
            s.referrerPolicy = 'no-referrer-when-downgrade';
            l.parentNode.insertBefore(s, l);
          })({});
        `}
      </Script>

      <Script id="pushup-ad" strategy="lazyOnload">
        {`
          (function(yahzo){
            var d = document,
                s = d.createElement('script'),
                l = d.scripts[d.scripts.length - 1];
            s.settings = yahzo || {};
            s.src = "//aggressivestruggle.com/b/XGVgs.d-Gqls0iYIWRcq/Yefm_9quoZvUflVkNPXTKY/2YOiTmM/xkNrTpIwtlNujhYU5UMezEEr1LMXwY";
            s.async = true;
            s.referrerPolicy = 'no-referrer-when-downgrade';
            l.parentNode.insertBefore(s, l);
          })({});
        `}
      </Script>
    </>
  );
}
