import { cn } from "@/lib/utils";

export function PageHeader({
  module, title, subtitle, icon: Icon, actions, className,
}: {
  module: string;
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-8 flex items-end justify-between gap-4 anim-fade-up", className)}>
      <div className="min-w-0">
        <div className="text-[10px] font-mono text-accent/80 uppercase tracking-[0.25em] mb-2 flex items-center gap-2">
          <span className="text-accent">{`>`}_</span>
          // {module}
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tighter neon-text flex items-center gap-3">
          {Icon && <Icon className="w-7 h-7 text-accent shrink-0" />}
          {title}
        </h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-2 font-mono max-w-xl">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
    </header>
  );
}
