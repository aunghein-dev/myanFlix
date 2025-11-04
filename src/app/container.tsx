"use client";

import Navbar from "../navigation/Navbar";
import Footer from "@/navigation/Footer";
import FloatingNavbar from "@/navigation/FloatingNavbar";
import SocialBarAd from "@/components/ads/SocialBarAd";

export default function Container({ children }: { children: React.ReactNode }) {

  return (
    <section>
      <Navbar/>
      <main className="main">{children}</main>
      <Footer/>
      <FloatingNavbar/>
      <SocialBarAd position="auto" zIndex={3000} />
    </section>
  );
}
