"use client";

import Navbar from "../navigation/Navbar";
import Footer from "@/navigation/Footer";
import FloatingNavbar from "@/navigation/FloatingNavbar";
import dynamic from "next/dynamic";
import AdsterraAdsLoader from "@/components/ads/AdsterraAdsLoader";

const TopLoader = dynamic(
  () => import("@/navigation/TopLoader").then((mod) => mod.TopLoader), 
  { ssr: false }
);

export default function Container({ children }: { children: React.ReactNode }) {

  return (
    <section className="relative">
      <AdsterraAdsLoader />
      <TopLoader/>
      <Navbar/>
      <main className="main">{children}</main>
      <Footer/>
      <FloatingNavbar/>
    </section>
  );
}
