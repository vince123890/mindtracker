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
  icon: string;
  permission: Permission | null;
  group?: string;
}

export const MENU: MenuItem[] = [
  // Dashboard & Reporting — "Dashboard Agregat Dual-Engine"; Dashboard & Integrasi — "Integrated Dashboard (Landing)"
  { href: "/", label: "Dashboard", icon: "📊", permission: null, group: "Dashboard" },
  { href: "/integrated", label: "Integrated Dashboard", icon: "🧭", permission: "integrated.read", group: "Dashboard" },

  // Engine 1 — PM Tracker
  { href: "/tracker", label: "Scorecard Proyek", icon: "🗒️", permission: "project.read", group: "Engine 1 — PM Tracker" },

  // Phase Gate Workflow
  { href: "/gates", label: "Persetujuan Gate", icon: "✅", permission: "gate.approve", group: "Phase Gate Workflow" },
  { href: "/revision-log", label: "Revision Log Terpusat", icon: "💬", permission: "project.read", group: "Phase Gate Workflow" },
  { href: "/gates/history", label: "Riwayat Transisi Gate", icon: "🔁", permission: "project.read", group: "Phase Gate Workflow" },

  // Engine 2 — RTO Tool
  { href: "/rto", label: "RTO Assessment", icon: "🛠️", permission: "rto.read", group: "Engine 2 — RTO Tool" },
  { href: "/rto/guide", label: "Panduan RTO", icon: "📘", permission: "rto.read", group: "Engine 2 — RTO Tool" },

  // Progress Snapshot
  { href: "/snapshots", label: "Snapshot & Progress Curve", icon: "📉", permission: "project.read", group: "Progress Snapshot" },

  // Dashboard DO (Dashboard & Integrasi)
  { href: "/do/production", label: "Production Performance", icon: "🏭", permission: "do.read", group: "Dashboard DO" },
  { href: "/do/parameters", label: "Key Parameter Operasi", icon: "🎛️", permission: "do.read", group: "Dashboard DO" },
  { href: "/do/maintenance", label: "Maintenance Performance", icon: "🔧", permission: "do.read", group: "Dashboard DO" },
  { href: "/do/management", label: "Management Dashboard", icon: "🏢", permission: "do.management.read", group: "Dashboard DO" },
  { href: "/do/rca", label: "Root Cause Analysis", icon: "🔎", permission: "do.read", group: "Dashboard DO" },
  { href: "/do/action-plans", label: "Action Plan Monitoring", icon: "📌", permission: "do.read", group: "Dashboard DO" },
  { href: "/strategy", label: "Strategy & Simulation", icon: "📈", permission: "strategy.read", group: "Dashboard DO" },

  // Master Data
  { href: "/projects", label: "Master Proyek", icon: "📁", permission: "project.read", group: "Master Data" },
  { href: "/master/phases", label: "Master Phase", icon: "🪜", permission: "master.read", group: "Master Data" },
  { href: "/master/chapters", label: "Dimension / Function", icon: "🗂️", permission: "master.read", group: "Master Data" },
  { href: "/master/deliverables", label: "Deliverable & Applicability", icon: "📚", permission: "master.read", group: "Master Data" },
  { href: "/master/project-types", label: "Tipe Proyek", icon: "🏷️", permission: "master.read", group: "Master Data" },
  { href: "/master/rto", label: "Master RTO", icon: "🧱", permission: "master.read", group: "Master Data" },
  { href: "/master/scoring-config", label: "Scoring Config", icon: "⚙️", permission: "master.read", group: "Master Data" },
  { href: "/master/workflow", label: "Workflow Config", icon: "🔀", permission: "master.read", group: "Master Data" },

  // Dashboard & Reporting / Administrasi
  { href: "/reports", label: "Laporan", icon: "📑", permission: "report.read", group: "Laporan & Administrasi" },
  { href: "/audit", label: "Audit Log", icon: "🕘", permission: "audit.read", group: "Laporan & Administrasi" },
];

export function menuFor(role: Role): MenuItem[] {
  return MENU.filter((m) => m.permission === null || can(role, m.permission));
}
