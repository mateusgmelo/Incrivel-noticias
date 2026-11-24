import { desc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { auditLogs, users } from "@/server/db/schema";

export type AuditEntry = {
  actorId: string | null;
  action: string; // ex.: article.publish, user.role_change
  entity: "article" | "user" | "category" | "ingest";
  entityId?: string | null;
  meta?: Record<string, unknown>;
};

export const auditService = {
  /** Falha de auditoria nunca deve derrubar a operação principal. */
  async record(entry: AuditEntry) {
    try {
      await db().insert(auditLogs).values({ ...entry, entityId: entry.entityId ?? null });
    } catch (err) {
      console.error("[audit] falha ao registrar", entry.action, err);
    }
  },

  async recent(limit = 30) {
    return db()
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        meta: auditLogs.meta,
        createdAt: auditLogs.createdAt,
        actorName: users.name,
      })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.actorId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  },
};
