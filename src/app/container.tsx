"use client";

import Navbar from "../navigation/Navbar";
import Footer from "@/navigation/Footer";
import FloatingNavbar from "@/navigation/FloatingNavbar";
import AdsLoader from "@/components/ads/AdsLoader";

export default function Container({ children }: { children: React.ReactNode }) {

  return (
    <section>
      <AdsLoader/>
      <Navbar/>
      <main className="main">{children}</main>
      <Footer/>
      <FloatingNavbar/>
    </section>
  );
}
