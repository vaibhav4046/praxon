import { Sidebar } from "@/components/sidebar";
import { Settings as SettingsIcon } from "lucide-react";
import { KeysEditor } from "@/components/settings/keys-editor";
import { PageHeader } from "@/components/page-header";

export default function SettingsPage() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8 max-w-4xl anim-fade-in overflow-y-auto h-screen">
        <PageHeader
          module="SETTINGS · KEYS"
          title="Configure"
          subtitle="Provider keys + runtime config · saved live · no restart"
          icon={SettingsIcon}
        />
        <KeysEditor />
        <section className="mt-10 rounded-xl border border-accent/20 bg-card/40 p-5">
          <div className="text-[10px] font-mono text-accent/80 uppercase tracking-[0.2em] mb-2">// STORAGE</div>
          <p className="text-sm text-muted-foreground font-mono">
            Data at <code className="text-accent">~/.praxon/</code> · override w/ <code className="text-accent">PRAXON_DATA_DIR</code>
          </p>
        </section>
      </main>
    </div>
  );
}
