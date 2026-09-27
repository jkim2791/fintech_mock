import { prisma } from "@/lib/db";
import { authorize, AuthorizationError, hasPermission, rolesWithPermission } from "@/lib/authz";
import type { Role } from "@/lib/auth/types";
import { recordAudit } from "@/lib/audit";
import {
  ACTIONS_REQUIRING_REASON,
  TRANSITIONS,
  type ActionRequest,
  type ActionResult,
  type CaseModule,
  type ReviewStatus,
} from "./types";

/**
 * Single code path for every privileged workflow action in every module:
 *   load -> authorize (server-side) -> validate transition -> mutate + audit
 *   in one transaction.
 */
export async function executeCaseAction<T extends { id: string; status: string }>(
  mod: CaseModule<T>,
  req: ActionRequest,
): Promise<ActionResult> {
  const entity = await mod.load(req.entityId);
  if (!entity) return { ok: false, error: `${mod.label} ${req.entityId} not found` };

  try {
    authorize(req.user, mod.requiredPermission(req.action, entity));
  } catch (e) {
    if (e instanceof AuthorizationError) return { ok: false, error: e.message };
    throw e;
  }

  const reason = req.reason.trim();
  if (ACTIONS_REQUIRING_REASON.includes(req.action) && reason.length < 3) {
    return { ok: false, error: "A reason is required for this action." };
  }

  if (req.action === "NOTE") {
    if (reason.length === 0) return { ok: false, error: "Note cannot be empty." };
    await prisma.$transaction(async (tx) => {
      await tx.caseNote.create({
        data: {
          entityType: mod.entityType,
          entityId: entity.id,
          authorId: req.user.id,
          authorName: req.user.name,
          authorRole: req.user.role,
          body: reason,
        },
      });
      await recordAudit(
        {
          actor: req.user,
          action: mod.auditAction("NOTE"),
          entityType: mod.entityType,
          entityId: entity.id,
          previousState: entity.status,
          newState: entity.status,
          reason,
        },
        tx,
      );
    });
    return { ok: true, message: "Note added." };
  }

  const transition = TRANSITIONS[req.action];
  const current = entity.status as ReviewStatus;
  if (!transition.from.includes(current)) {
    return { ok: false, error: `Cannot ${req.action.toLowerCase()} a case in status ${current}.` };
  }

  await prisma.$transaction(async (tx) => {
    await mod.updateStatus(tx, entity.id, transition.to);
    await recordAudit(
      {
        actor: req.user,
        action: mod.auditAction(req.action),
        entityType: mod.entityType,
        entityId: entity.id,
        previousState: current,
        newState: transition.to,
        reason,
      },
      tx,
    );
  });

  return { ok: true, message: `${mod.label} ${entity.id} ${transition.to.toLowerCase()}.` };
}

/** Which actions the current user could perform right now (for UI hints only; the engine re-checks). */
export function describeActionAvailability<T extends { id: string; status: string }>(
  mod: CaseModule<T>,
  entity: T,
  role: Role,
) {
  const status = entity.status as ReviewStatus;
  return (["NOTE", "ESCALATE", "APPROVE", "REJECT"] as const).map((action) => {
    const permission = mod.requiredPermission(action, entity);
    const permitted = hasPermission(role, permission);
    const transitionOk = action === "NOTE" || TRANSITIONS[action].from.includes(status);
    return {
      action,
      permission,
      permitted,
      transitionOk,
      requiredRoles: rolesWithPermission(permission),
      policyNote: mod.policyNote(action, entity),
    };
  });
}
