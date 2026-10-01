import "server-only";
import { cookies } from "next/headers";
import { forbidden, notFound } from "next/navigation";
import { can, type Permission } from "./roles";
import { findUser, type DummyUser } from "./users";

export const USER_COOKIE = "mt_user";

/** User aktif dari cookie pengalih role. Prototype: tanpa autentikasi (blueprint P-1). */
export async function currentUser(): Promise<DummyUser> {
  const store = await cookies();
  return findUser(store.get(USER_COOKIE)?.value);
}

/** Penegakan akses di server — menu tersembunyi saja tidak cukup (blueprint P-3). */
export async function requirePermission(permission: Permission): Promise<DummyUser> {
  const user = await currentUser();
  if (!can(user.role, permission)) forbidden();
  return user;
}

export function isMindId(user: DummyUser): boolean {
  return can(user.role, "crossholding.read");
}

/** Isolasi Anggota Holding (BR-16): data organisasi lain dibalas 404, bukan 403. */
export function assertOrgAccess(user: DummyUser, organizationId: string): void {
  if (!isMindId(user) && user.organizationId !== organizationId) notFound();
}
