import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="max-w-md w-full rounded-2xl glass-strong p-8 text-center">
        <div className="w-12 h-12 rounded-full praxon-gradient grid place-items-center mx-auto mb-4">
          <Compass className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-semibold mb-2">Lost in the workspace.</h1>
        <p className="text-sm text-muted-foreground mb-6">That page doesn't exist. Maybe you meant to head somewhere else?</p>
        <div className="flex gap-2 justify-center">
          <Link href="/" className="px-3 py-2 rounded-lg praxon-gradient text-white text-sm">Home</Link>
          <Link href="/chat" className="px-3 py-2 rounded-lg glass text-sm">Open chat</Link>
        </div>
      </div>
    </main>
  );
}
