import {
  Database,
  Flame,
  Layers3,
  Smartphone,
  Triangle,
  type LucideIcon,
} from "lucide-react";

import type { StackIcon as StackIconName } from "@/lib/stacks";

const icons: Record<StackIconName, LucideIcon> = {
  next: Triangle,
  supabase: Database,
  firebase: Flame,
  drizzle: Layers3,
  expo: Smartphone,
};

const tones: Record<StackIconName, string> = {
  next: "border-zinc-700 bg-zinc-900 text-zinc-100",
  supabase: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  firebase: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  drizzle: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  expo: "border-purple-500/30 bg-purple-500/10 text-purple-300",
};

export function StackIcon({
  className = "",
  icon,
}: {
  className?: string;
  icon: StackIconName;
}) {
  const Icon = icons[icon];

  return (
    <span
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${tones[icon]} ${className}`}
    >
      <Icon aria-hidden="true" className="h-5 w-5" />
    </span>
  );
}
