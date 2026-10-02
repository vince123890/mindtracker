// Role, permission, dan menu — Analysis/menu_blue_print.md §0 & §Menu × Role.
// Pengelompokan menu mengikuti modul pada Analysis/[Timeline & Effort] MindID - Mind Tracker.xlsx.

export type Role =
  | "PMO_ADMIN"
  | "DIREKTUR_MIND_ID"
  | "DIVISI_MIND_ID"
  | "DIVISI_DO_MIND_ID"
  | "DIREKTUR_AH"
  | "PMO_AH"
  | "TIM_PROYEK"
  | "PIC_OPERASI_AH";

export const ROLE_LABEL: Record<Role, string> = {
  PMO_ADMIN: "PMO Admin (MIND ID)",
  DIREKTUR_MIND_ID: "Direktur MIND ID",
  DIVISI_MIND_ID: "Divisi MIND ID",
  DIVISI_DO_MIND_ID: "Divisi DO MIND ID",
  DIREKTUR_AH: "Direktur Anggota Holding",
  PMO_AH: "PMO Anggota Holding",
  TIM_PROYEK: "Tim Proyek",
  PIC_OPERASI_AH: "PIC Operasi AH",
};

export type Permission =
  | "project.read"
  | "project.write"
  | "project.changetype"
  | "score.write"
  | "conditional.resolve"
  | "feedback.write"
  | "phase.comment"
  | "gate.submit"
  | "gate.approve"
  | "crossholding.read"
  | "integrated.read"
  | "rto.read"
  | "rto.write"
  | "rto.review"
  | "snapshot.build"
  | "do.read"
  | "do.management.read"
  | "do.rca.write"
  | "do.rca.approve"
  | "do.actionplan.write"
  | "do.actionplan.verify"
  | "strategy.read"
  | "master.read"
  | "master.write"
  | "report.read"
  | "audit.read";

const P: Record<Role, Permission[]> = {
  PMO_ADMIN: [
    "project.read", "project.write", "project.changetype", "score.write", "conditional.resolve",
    "feedback.write", "phase.comment", "gate.submit", "gate.approve", "crossholding.read", "integrated.read",
    "rto.read", "rto.write", "rto.review", "snapshot.build", "do.read", "do.management.read",
    "strategy.read", "master.read", "master.write", "report.read", "audit.read",
  ],
  DIREKTUR_MIND_ID: [
    "project.read", "crossholding.read", "integrated.read", "rto.read", "do.read", "do.management.read",
    "strategy.read", "report.read", "audit.read",
  ],
  DIVISI_MIND_ID: ["project.read", "crossholding.read", "integrated.read", "rto.read", "feedback.write", "report.read"],
  DIVISI_DO_MIND_ID: [
    "crossholding.read", "integrated.read", "do.read", "do.management.read", "do.rca.write", "do.rca.approve",
    "do.actionplan.write", "do.actionplan.verify", "strategy.read", "report.read",
  ],
  DIREKTUR_AH: ["project.read", "integrated.read", "rto.read", "do.read", "report.read"],
  PMO_AH: [
    "project.read", "project.write", "score.write", "conditional.resolve", "phase.comment", "gate.submit",
    "integrated.read", "rto.read", "rto.write", "report.read", "audit.read",
  ],
  TIM_PROYEK: ["project.read", "score.write", "rto.read", "rto.write", "report.read"],
  PIC_OPERASI_AH: ["integrated.read", "do.read", "do.rca.write", "do.actionplan.write", "report.read"],
};

export function can(role: Role, permission: Permission): boolean {
  return P[role].includes(permission);
}

export interface MenuItem {
  href: string;
  label: string;
  /** Nama ikon lucide (dipetakan di components/app-nav.tsx). */
  icon: string;
  permission: Permission | null;
  group: MenuGroup;
}

export type MenuGroup = "dashboard" | "tracker" | "gate" | "rto" | "snapshot" | "do" | "master" | "report";

/** Menu tingkat atas = modul pada Analysis/[Timeline & Effort]; sub menu = item di dalamnya. */
export const MENU_GROUPS: { id: MenuGroup; label: string; module: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", module: "Dashboard & Reporting · Integrated Dashboard", icon: "LayoutDashboard" },
  { id: "tracker", label: "PM Tracker", module: "Engine 1 — PM Tracker", icon: "ClipboardList" },
  { id: "gate", label: "Phase Gate", module: "Phase Gate Workflow", icon: "CircleCheck" },
  { id: "rto", label: "RTO Tool", module: "Engine 2 — RTO Tool", icon: "Wrench" },
  { id: "snapshot", label: "Snapshot", module: "Progress Snapshot", icon: "ChartLine" },
  { id: "do", label: "Dashboard DO", module: "Dashboard DO", icon: "Factory" },
  { id: "master", label: "Master Data", module: "Master Data", icon: "Database" },
  { id: "report", label: "Laporan", module: "Laporan & Administrasi", icon: "FileText" },
];

export const MENU: MenuItem[] = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard", permission: null, group: "dashboard" },
  { href: "/integrated", label: "Integrated Dashboard", icon: "Compass", permission: "integrated.read", group: "dashboard" },
  { href: "/integrated/risk", label: "Risk PRISMA", icon: "TriangleAlert", permission: "integrated.read", group: "dashboard" },

  { href: "/tracker", label: "Scorecard Proyek", icon: "ClipboardList", permission: "project.read", group: "tracker" },

  { href: "/gates", label: "Persetujuan Gate", icon: "CircleCheck", permission: "gate.approve", group: "gate" },
  { href: "/revision-log", label: "Revision Log Terpusat", icon: "MessageSquare", permission: "project.read", group: "gate" },
  { href: "/gates/history", label: "Riwayat Transisi Gate", icon: "History", permission: "project.read", group: "gate" },

  { href: "/rto", label: "RTO Assessment", icon: "Wrench", permission: "rto.read", group: "rto" },
  { href: "/rto/guide", label: "Panduan RTO", icon: "BookOpen", permission: "rto.read", group: "rto" },

  { href: "/snapshots", label: "Snapshot & Progress Curve", icon: "ChartLine", permission: "project.read", group: "snapshot" },

  { href: "/do/production", label: "Production Performance", icon: "Factory", permission: "do.read", group: "do" },
  { href: "/do/parameters", label: "Key Parameter Operasi", icon: "Gauge", permission: "do.read", group: "do" },
  { href: "/do/maintenance", label: "Maintenance Performance", icon: "Cog", permission: "do.read", group: "do" },
  { href: "/do/management", label: "Management Dashboard", icon: "Building2", permission: "do.management.read", group: "do" },
  { href: "/do/rca", label: "Root Cause Analysis", icon: "Search", permission: "do.read", group: "do" },
  { href: "/do/action-plans", label: "Action Plan Monitoring", icon: "Pin", permission: "do.read", group: "do" },
  { href: "/strategy", label: "Strategy & Simulation", icon: "TrendingUp", permission: "strategy.read", group: "do" },

  { href: "/projects", label: "Master Proyek", icon: "FolderKanban", permission: "project.read", group: "master" },
  { href: "/master/phases", label: "Master Phase", icon: "ListOrdered", permission: "master.read", group: "master" },
  { href: "/master/chapters", label: "Dimension / Function", icon: "FolderTree", permission: "master.read", group: "master" },
  { href: "/master/deliverables", label: "Deliverable & Applicability", icon: "Library", permission: "master.read", group: "master" },
  { href: "/master/project-types", label: "Tipe Proyek", icon: "Tags", permission: "master.read", group: "master" },
  { href: "/master/rto", label: "Master RTO", icon: "Blocks", permission: "master.read", group: "master" },
  { href: "/master/scoring-config", label: "Scoring Config", icon: "SlidersHorizontal", permission: "master.read", group: "master" },
  { href: "/master/workflow", label: "Workflow Config", icon: "Workflow", permission: "master.read", group: "master" },

  { href: "/reports", label: "Laporan", icon: "FileText", permission: "report.read", group: "report" },
  { href: "/audit", label: "Audit Log", icon: "ScrollText", permission: "audit.read", group: "report" },
  { href: "/design-system", label: "Design System", icon: "Palette", permission: null, group: "report" },
];

export function menuFor(role: Role): MenuItem[] {
  return MENU.filter((m) => m.permission === null || can(role, m.permission));
}
