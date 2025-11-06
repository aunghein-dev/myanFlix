"use client";

import Navbar from "../navigation/Navbar";
import Footer from "@/navigation/Footer";
import FloatingNavbar from "@/navigation/FloatingNavbar";
import dynamic from "next/dynamic";
import ExoClickAd from "@/components/ads/ExoAdsLoader";

const TopLoader = dynamic(
  () => import("@/navigation/TopLoader").then((mod) => mod.TopLoader), 
  { ssr: false }
);

export default function Container({ children }: { children: React.ReactNode }) {

  return (
    <section className="relative">
      <ExoClickAd 
        className="eas6a97888e35"
        zoneId="5762684" 
      />
      <ExoClickAd 
        className="eas6a97888e17"
        zoneId="5762660" 
      />
      <TopLoader/>
      <Navbar/>
      <main className="main">{children}</main>
      <Footer/>
      <FloatingNavbar/>
    </section>
  );
}
