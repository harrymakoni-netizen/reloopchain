import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return <section className={cn("panel", className)}>{children}</section>;
}

export function PanelHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  className?: string | undefined;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-3.5",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[0.9375rem] font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function PageHeading({
  eyebrow,
  title,
  lede,
  actions,
}: {
  eyebrow?: string | undefined;
  title: string;
  lede?: ReactNode | undefined;
  actions?: ReactNode | undefined;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div className="max-w-2xl">
        {eyebrow ? <p className="label-caps">{eyebrow}</p> : null}
        <h1 className="mt-1.5 text-2xl font-semibold text-foreground md:text-[1.75rem]">
          {title}
        </h1>
        {lede ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{lede}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Metric({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode | undefined;
  tone?: "default" | "warn" | "ok" | undefined;
}) {
  return (
    <div className="flex flex-col justify-between border-border px-5 py-4">
      <p className="label-caps">{label}</p>
      <p
        className={cn(
          "tnum mt-3 text-[1.6rem] font-semibold leading-none",
          tone === "warn" && "text-warn",
          tone === "ok" && "text-forest",
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-2 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

type Tone = "neutral" | "ok" | "warn" | "danger" | "info" | "muted";

const toneClass: Record<Tone, string> = {
  neutral: "border-border-strong bg-surface-sunken text-foreground",
  muted: "border-border bg-surface-sunken text-muted-foreground",
  ok: "border-forest/30 bg-forest/8 text-forest",
  warn: "border-warn/35 bg-warn/8 text-warn",
  danger: "border-danger/35 bg-danger/8 text-danger",
  info: "border-info/30 bg-info/8 text-info",
};

export function Status({
  children,
  tone = "neutral",
  dot = true,
}: {
  children: ReactNode;
  tone?: Tone | undefined;
  dot?: boolean | undefined;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-[0.6875rem] font-medium",
        toneClass[tone],
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current opacity-70" /> : null}
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
  error,
}: {
  label: string;
  hint?: string | undefined;
  htmlFor?: string | undefined;
  children: ReactNode;
  error?: string | undefined;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold text-foreground"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function Note({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: Tone | undefined;
}) {
  return (
    <p
      className={cn(
        "rounded-sm border px-3 py-2 text-xs leading-relaxed",
        toneClass[tone],
      )}
    >
      {children}
    </p>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode | undefined;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
        {body}
      </p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function TableScroll({ children }: { children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[720px]">{children}</div>
    </div>
  );
}

export function Th({
  children,
  align = "left",
  className,
}: {
  children?: ReactNode | undefined;
  align?: "left" | "right" | undefined;
  className?: string | undefined;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "label-caps border-b border-border px-4 py-2.5 font-semibold",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className,
}: {
  children?: ReactNode | undefined;
  align?: "left" | "right" | undefined;
  className?: string | undefined;
}) {
  return (
    <td
      className={cn(
        "border-b border-border/70 px-4 py-2.5 text-[0.8125rem] text-foreground",
        align === "right" ? "tnum text-right" : "text-left",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Mono({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[0.75rem] tracking-tight text-foreground">
      {children}
    </span>
  );
}

export function DemoBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-sm border border-warn/35 bg-warn/8 px-3 py-2 text-xs font-medium text-warn">
      {children}
    </div>
  );
}
