import {
  Activity, ArrowLeft, Bell, Blocks, BookOpen, Building2, ChartColumn, ChartLine, ChevronDown, CircleCheck, ClipboardList,
  Cog, Compass, Database, Factory, FileText, FolderKanban, FolderTree, Gauge, History, LayoutDashboard, Library,
  ListOrdered, Menu, MessageSquare, Palette, Pin, ScrollText, Search, ShieldCheck, SlidersHorizontal, Tags,
  TrendingUp, TriangleAlert, Trophy, Workflow, Wrench, X, type LucideIcon,
} from "lucide-react";

/** Ikon outline (lucide) — satu peta nama → komponen agar menu bisa didefinisikan sebagai data. */
export const ICONS: Record<string, LucideIcon> = {
  Activity, ArrowLeft, Bell, Blocks, BookOpen, Building2, ChartColumn, ChartLine, ChevronDown, CircleCheck, ClipboardList,
  Cog, Compass, Database, Factory, FileText, FolderKanban, FolderTree, Gauge, History, LayoutDashboard, Library,
  ListOrdered, Menu, MessageSquare, Palette, Pin, ScrollText, Search, ShieldCheck, SlidersHorizontal, Tags,
  TrendingUp, TriangleAlert, Trophy, Workflow, Wrench, X,
};

export function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const C = ICONS[name] ?? FileText;
  return <C className={className} strokeWidth={1.75} aria-hidden />;
}
