import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from './enums';
import { ILoggedInUser } from '../models/LoggedInUser';
import { assertUserCanAccessGroup, GroupForAccessCheck } from './group-access';

const makeUser = (partial: Partial<ILoggedInUser>): ILoggedInUser =>
  ({
    id: 1,
    email: 'test@example.test',
    role: Role.User,
    organizationId: 1,
    api_user_id: 'api-user-1',
    ...partial,
  }) as ILoggedInUser;

const makeGroup = (
  partial: Partial<GroupForAccessCheck> = {},
): GroupForAccessCheck => ({
  organizationId: 1,
  buyerId: null,
  api_user_id: null,
  ...partial,
});

describe('assertUserCanAccessGroup', () => {
  it('throws NotFoundException (404) when group is null', () => {
    expect(() =>
      assertUserCanAccessGroup(null, makeUser({ role: Role.Admin })),
    ).toThrow(NotFoundException);
  });

  describe('Admin', () => {
    it('bypasses all org checks', () => {
      expect(() =>
        assertUserCanAccessGroup(
          makeGroup({ organizationId: 999, buyerId: 888, api_user_id: 'nope' }),
          makeUser({ role: Role.Admin, organizationId: 1 }),
        ),
      ).not.toThrow();
    });
  });

  describe('Registrant', () => {
    it('passes when group.api_user_id matches', () => {
      expect(() =>
        assertUserCanAccessGroup(
          makeGroup({ api_user_id: 'same' }),
          makeUser({ role: Role.Registrant, api_user_id: 'same' }),
        ),
      ).not.toThrow();
    });

    it('throws Forbidden with a registrant-specific message when it does not', () => {
      expect(() =>
        assertUserCanAccessGroup(
          makeGroup({ api_user_id: 'theirs' }),
          makeUser({ role: Role.Registrant, api_user_id: 'mine' }),
        ),
      ).toThrow(ForbiddenException);
      expect(() =>
        assertUserCanAccessGroup(
          makeGroup({ api_user_id: 'theirs' }),
          makeUser({ role: Role.Registrant, api_user_id: 'mine' }),
        ),
      ).toThrow(/registrant/i);
    });

    it('does not fall back to organizationId match (api_user_id is the only gate)', () => {
      // Same org, different api_user_id → still rejected.
      expect(() =>
        assertUserCanAccessGroup(
          makeGroup({ organizationId: 1, api_user_id: 'theirs' }),
          makeUser({
            role: Role.Registrant,
            organizationId: 1,
            api_user_id: 'mine',
          }),
        ),
      ).toThrow(ForbiddenException);
    });
  });

  describe('Buyer / SubBuyer', () => {
    for (const role of [Role.Buyer, Role.SubBuyer]) {
      it(`${role} passes when group.buyerId matches user.organizationId`, () => {
        expect(() =>
          assertUserCanAccessGroup(
            makeGroup({ buyerId: 42, organizationId: 99 }),
            makeUser({ role, organizationId: 42 }),
          ),
        ).not.toThrow();
      });
    }

    it('Buyer falls back to organizationId match if buyerId is null', () => {
      // Buyer-role user in the same org as the group but the group has no
      // buyerId wired — still allowed, the user's own org owns the group.
      expect(() =>
        assertUserCanAccessGroup(
          makeGroup({ buyerId: null, organizationId: 42 }),
          makeUser({ role: Role.Buyer, organizationId: 42 }),
        ),
      ).not.toThrow();
    });

    it('Buyer is rejected when neither buyerId nor organizationId matches', () => {
      expect(() =>
        assertUserCanAccessGroup(
          makeGroup({ buyerId: 99, organizationId: 77 }),
          makeUser({ role: Role.Buyer, organizationId: 42 }),
        ),
      ).toThrow(/buyer/i);
    });
  });

  describe('Default (every other role)', () => {
    for (const role of [
      Role.User,
      Role.SiteOperator,
      Role.Reviewer,
      Role.SeniorReviewer,
    ]) {
      it(`${role} falls back to organizationId match`, () => {
        expect(() =>
          assertUserCanAccessGroup(
            makeGroup({ organizationId: 7 }),
            makeUser({ role, organizationId: 7 }),
          ),
        ).not.toThrow();
        expect(() =>
          assertUserCanAccessGroup(
            makeGroup({ organizationId: 7 }),
            makeUser({ role, organizationId: 8 }),
          ),
        ).toThrow(/organization/i);
      });
    }
  });

  it('narrows the group type for callers (TypeScript asserts non-null)', () => {
    const group: GroupForAccessCheck | null = makeGroup();
    assertUserCanAccessGroup(group, makeUser({ role: Role.Admin }));
    // After the assert, TypeScript treats `group` as non-null — compiler
    // check via property access below; runtime just confirms no throw.
    expect(group.organizationId).toBe(1);
  });
});
