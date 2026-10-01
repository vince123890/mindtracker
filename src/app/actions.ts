"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { USER_COOKIE } from "@/lib/auth/session";
import { DUMMY_USERS } from "@/lib/auth/users";

/** Pengalih role — prototype tanpa autentikasi (blueprint P-1). */
export async function switchUser(formData: FormData): Promise<void> {
  const id = String(formData.get("userId") ?? "");
  if (!DUMMY_USERS.some((u) => u.id === id)) return;
  const store = await cookies();
  store.set(USER_COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/");
}
