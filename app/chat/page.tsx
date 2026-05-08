import { Sidebar } from "@/components/sidebar";
import { ChatView } from "@/components/chat/chat-view";
import { Suspense } from "react";

export default function ChatPage() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <Suspense fallback={<div className="h-screen grid place-items-center text-muted-foreground">Loading…</div>}>
          <ChatView />
        </Suspense>
      </main>
    </div>
  );
}
