"use client";

import Navbar from "../navigation/Navbar";
import Footer from "@/navigation/Footer";
import FloatingNavbar from "@/navigation/FloatingNavbar";
import dynamic from "next/dynamic";


const HilltopAds = dynamic(() => import('../components/ads/HilltopAds'), { ssr: false });

export default function Container({ children }: { children: React.ReactNode }) {

  return (
    <section>
      <HilltopAds/>
      <Navbar/>
      <main className="main">{children}</main>
      <Footer/>
      <FloatingNavbar/>
    </section>
  );
}
