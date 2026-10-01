// Sembilan user dummy statis — prototype TANPA autentikasi (blueprint P-1).
// Harus sama dengan seed `app_user` di supabase/seed.sql.

import type { Role } from "./roles";

export interface DummyUser {
  id: string;
  name: string;
  role: Role;
  organizationId: string;
  organizationName: string;
}

export const DUMMY_USERS: DummyUser[] = [
  { id: "u-pmo-admin", name: "Rina (PMO MIND ID)", role: "PMO_ADMIN", organizationId: "MIND", organizationName: "MIND ID" },
  { id: "u-dir-mind", name: "Budi (Direktur MIND ID)", role: "DIREKTUR_MIND_ID", organizationId: "MIND", organizationName: "MIND ID" },
  { id: "u-div-mind", name: "Sari (Divisi MIND ID)", role: "DIVISI_MIND_ID", organizationId: "MIND", organizationName: "MIND ID" },
  { id: "u-div-do", name: "Andi (Divisi DO MIND ID)", role: "DIVISI_DO_MIND_ID", organizationId: "MIND", organizationName: "MIND ID" },
  { id: "u-dir-antam", name: "Dewi (Direktur Antam)", role: "DIREKTUR_AH", organizationId: "ANTAM", organizationName: "PT Aneka Tambang Tbk" },
  { id: "u-pmo-antam", name: "Eko (PMO Antam)", role: "PMO_AH", organizationId: "ANTAM", organizationName: "PT Aneka Tambang Tbk" },
  { id: "u-tim-antam", name: "Fajar (Tim Proyek Antam)", role: "TIM_PROYEK", organizationId: "ANTAM", organizationName: "PT Aneka Tambang Tbk" },
  { id: "u-pic-antam", name: "Gita (PIC Operasi Antam)", role: "PIC_OPERASI_AH", organizationId: "ANTAM", organizationName: "PT Aneka Tambang Tbk" },
  { id: "u-pmo-timah", name: "Hadi (PMO Timah)", role: "PMO_AH", organizationId: "TIMAH", organizationName: "PT Timah Tbk" },
];

export const DEFAULT_USER_ID = "u-pmo-admin";

export function findUser(id: string | undefined): DummyUser {
  return DUMMY_USERS.find((u) => u.id === id) ?? DUMMY_USERS.find((u) => u.id === DEFAULT_USER_ID)!;
}
