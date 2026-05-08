"use client";
import Link from "next/link";
import { Github } from "lucide-react";
import { useEffect, useState } from "react";
import { PraxonLogo } from "@/components/brand/logo";
import { ThemeSwitch } from "@/components/brand/theme-switch";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`sticky top-0 z-30 transition-all ${scrolled ? "backdrop-blur-md bg-background/70 border-b border-accent/30" : "bg-transparent"}`}>
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="group-hover:scale-105 transition-transform">
            <PraxonLogo size={28} animated />
          </div>
          <span className="font-mono font-semibold tracking-tight">PRAXON</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/chat" className="px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors">Chat</Link>
          <Link href="/dashboard" className="px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Dashboard</Link>
          <Link href="/research" className="px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors hidden md:inline">Research</Link>
          <Link href="/code" className="px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors hidden md:inline">Code</Link>
          <a href="https://github.com/praxon-dev/praxon" className="px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors hidden sm:flex items-center gap-1.5"><Github className="w-3.5 h-3.5" /> GitHub</a>
          <ThemeSwitch />
          <Link href="/onboarding" className="ml-2 px-3 py-1.5 rounded-lg praxon-gradient text-white text-xs font-medium hover:scale-105 transition-transform">Get started</Link>
        </nav>
      </div>
    </header>
  );
}
