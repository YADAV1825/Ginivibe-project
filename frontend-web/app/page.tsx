"use client";

import React from "react";
import { useRouter } from "next/navigation";
import "@/components/landing/landing.css";
import { SiteHeader } from "@/components/landing/site-header";
import { Hero, ProofStrip } from "@/components/landing/hero";
import { FeaturesSlate } from "@/components/landing/features-slate";
import { Closing } from "@/components/landing/closing";
import { Testimonials, ShowcaseStack } from "@/components/landing/social-proof";

export default function LandingPage() {
  const router = useRouter();

  // Auth always lives on its own routes: Get started → sign up,
  // Sign in → login. No modal, so the URL always reflects the screen.
  const handleOpenAuth = (mode: "login" | "register" = "login") => {
    router.push(mode === "register" ? "/register" : "/login");
  };

  return (
    <div className="gv-page" id="top">
      <SiteHeader onOpenAuth={handleOpenAuth} />
      <main>
        <Hero onOpenAuth={handleOpenAuth} />
        <ProofStrip />
        <ShowcaseStack />
        <FeaturesSlate />
        <Testimonials />
        <Closing onOpenAuth={handleOpenAuth} />
      </main>
    </div>
  );
}
