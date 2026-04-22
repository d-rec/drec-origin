import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Role } from './enums';
import { ILoggedInUser } from '../models/LoggedInUser';

/**
 * Role-aware access check for `device_group` reads (certificate-log, device
 * audit endpoints, etc.).
 *
 * The hard bug this replaces: the old endpoints compared
 * `group.organizationId != user.organizationId` across the board, which is
 * only right when the caller happens to be in the group's owning org.
 * Buyers, Admins, and cross-org integrations all got a generic
 * `"Group UId is not of this buyer, invalid value was sent"` — confusingly
 * worded (the check has nothing to do with the buyer role) and with no
 * way to distinguish why.
 *
 * The check a caller passes depends on their role:
 *
 *   - `Admin`         → no org restriction. Platform admins see everything.
 *   - `Registrant`    → `group.api_user_id === user.api_user_id`. An
 *                       api-key-level scope match; organizationId on the
 *                       registrant's user row can differ from the group's
 *                       owning org.
 *   - `Buyer` / `SubBuyer` → `group.buyerId === user.organizationId`. The
 *                       buyer's org is the buyer-side of the reservation.
 *   - Everyone else   → `group.organizationId === user.organizationId`.
 *                       Legacy same-org check.
 *
 * Throws `404 ConflictException` if the group is absent (caller looked up
 * a non-existent UID), or `403 ForbiddenException` with a role-specific
 * message if the group exists but the user can't access it.
 */
export function assertUserCanAccessGroup(
  group: GroupForAccessCheck | null,
  user: ILoggedInUser,
): asserts group is GroupForAccessCheck {
  if (group === null) {
    throw new ConflictException({
      success: false,
      message: 'Group UID not found',
    });
  }

  switch (user.role) {
    case Role.Admin:
      return;

    case Role.Registrant:
      if (group.api_user_id === user.api_user_id) return;
      throw new ForbiddenException({
        success: false,
        message: 'Group UID does not belong to this registrant',
      });

    case Role.Buyer:
    case Role.SubBuyer:
      if (group.buyerId === user.organizationId) return;
      throw new ForbiddenException({
        success: false,
        message: 'Group UID is not of this buyer',
      });

    default:
      if (group.organizationId === user.organizationId) return;
      throw new ForbiddenException({
        success: false,
        message: 'Group UID is not of your organization',
      });
  }
}

/**
 * Minimal subset of `DeviceGroup` that the access check depends on.
 * Avoids pulling the whole entity into callers that only need this helper.
 */
export interface GroupForAccessCheck {
  organizationId: number;
  buyerId: number | null | undefined;
  api_user_id: string | null | undefined;
}
