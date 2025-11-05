import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google"; 
import "./globals.css";
import Container from "./container";
import Script from 'next/script';
import SocialBarAd from "@/components/ads/SocialBarAd";
import Head from "next/head";


export const metadata: Metadata = {
  title: "myanFlix — Watch Free Movies & Live Football Streaming in HD",
  description: "Watch and download the latest movies, TV shows, and live football matches for free on myanFlix. Enjoy smooth HD streaming anytime, anywhere — no subscriptions required.",
  keywords: [
    "myanflix", 
    "free movies", 
    "watch movies online", 
    "live football streaming", 
    "HD movies", 
    "Myanmar movies", 
    "watch football free", 
    "sports live", 
    "latest movies"
  ],
  icons: {
    icon: '/favicon.ico',
  },
};


const oswald = Oswald({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-oswald',
});


const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en">
      <Head>
        <link rel="icon" href="/favicon.ico"/>
      </Head>
      <body className={`${oswald.variable} ${inter.variable} antialiased`}>
        <SocialBarAd position="auto" zIndex={9000} />
        <Container>{children}</Container>
        

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-YMXJE571BD"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-YMXJE571BD');
          `}
        </Script>
      </body>
    </html>
  );
}
