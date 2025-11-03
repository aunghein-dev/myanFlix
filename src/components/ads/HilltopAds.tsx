'use client';
import Script from 'next/script';

export default function HilltopAds() {
  return (
    <>
      {/* Pre-roll / video slider ad */}
      <Script
        src="//aggressivestruggle.com/b/XEV/s.daGfl/0FYUWVcA/ceimQ9RuUZOU/l_kePeTMYG2YODT/MCxqNHDsQftrN/jEYd5GMWz/E/0WNHQC"
        strategy="lazyOnload"
        referrerPolicy="no-referrer-when-downgrade"
      />

      {/* Pushup ad */}
      <Script
        src="//aggressivestruggle.com/b/XGVgs.d-Gqls0iYIWRcq/Yefm_9quoZvUflVkNPXTKY/2YOiTmM/xkNrTpIwtlNujhYU5UMezEEr1LMXwY"
        strategy="lazyOnload"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </>
  );
}
