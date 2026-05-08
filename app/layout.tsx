import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { CommandPalette } from "@/components/cmdk/command-palette";
import { ThemeProviderClient } from "@/components/brand/theme-switch";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Praxon — open-source AI agent platform",
  description: "Free LLMs, local-first, cloud-deployable. Chat, code, automate, browse, research — all in one open-source workspace. Replaces Claude Cowork, Claude Code, and Perplexity Computer.",
  metadataBase: new URL("https://praxon.dev"),
  openGraph: {
    title: "Praxon — open-source AI agent platform",
    description: "Claude Cowork alternative. Free forever. Self-host or deploy anywhere.",
    type: "website",
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${mono.variable} dark`}>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground selection:bg-accent/30">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark" disableTransitionOnChange>
          <ThemeProviderClient>
            {children}
            <CommandPalette />
            <Toaster position="bottom-right" richColors closeButton theme="dark" />
          </ThemeProviderClient>
        </ThemeProvider>
      </body>
    </html>
  );
}
