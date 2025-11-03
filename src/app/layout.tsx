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
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en">
      <head>
        <meta
          name="3d8d6d5c630cf7bff57658c89757a9d557fabb25"
          content="3d8d6d5c630cf7bff57658c89757a9d557fabb25"
        />
        <meta name="referrer" content="no-referrer-when-downgrade" />
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
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
