import Script from 'next/script';

export default function VideoSliderAd() {
  return (
    <Script id="videoslider" strategy="lazyOnload">
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
  );
}
