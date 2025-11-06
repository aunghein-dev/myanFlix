'use client';
import Script from 'next/script';

export default function HilltopAdsLoader() {
  return (
    <>  
      <Script
        id="video-slider-hilltop-ads-script"
        src="//aggressivestruggle.com/bmX.VAs_dyGklK0sYKWQci/we_mc9puqZpURlxkFPnTDYq2/OXTRMmxqNNDwQHtyNHjkYb5DMBzuEw0HN/Ql"
        strategy="afterInteractive"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <Script 
        id="push-up-hilltop-ads-script"
        src="//aggressivestruggle.com/b/XGVgs.d-Gqls0iYIWRcq/Yefm_9quoZvUflVkNPXTKY/2YOiTmM/xkNrTpIwtlNujhYU5UMezEEr1LMXwY"
        strategy="lazyOnload"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </>
  );
}
