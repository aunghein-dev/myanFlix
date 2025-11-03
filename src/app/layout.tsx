import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; 
import "./globals.css";
import Container from "./container";
import Script from 'next/script';


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


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
      
        <Container>
          {children}
        </Container>

        <Script
          src='//pl27965725.effectivegatecpm.com/9a/61/56/9a6156d154dc1851a1897a71a24d9eb2.js'
          strategy="afterInteractive" 
          id="myanflix-social-bar-ad" 
        />
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