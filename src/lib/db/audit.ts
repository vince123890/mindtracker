import "server-only";
import type { DummyUser } from "@/lib/auth/users";
import { db, must } from "./client";

export async function writeAudit(
  user: DummyUser,
  entityType: string,
  entityId: string,
  action: string,
  changes?: Record<string, unknown>,
  reason?: string,
): Promise<void> {
  must(
    await db().from("audit_log_entry").insert({
      actor_id: user.id,
      actor_role: user.role,
      entity_type: entityType,
      entity_id: entityId,
      action,
      changes: changes ?? null,
      reason: reason ?? null,
    }),
    "audit",
  );
}
