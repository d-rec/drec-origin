import { Role } from '../utils/enums';
import { ILoggedInUser, IUser } from '../models';
import { Organization } from '../pods/organization/organization.entity';

export const canManageOrganization = ({
  user,
  organization,
  organizationAdmin,
}: {
  user: ILoggedInUser;
  organizationAdmin: IUser;
  organization: Organization;
}): boolean => {
  if (!organization) return false;

  if (user.role !== Role.ApiUser) {
    return user.organizationId === organization.id;
  }

  if (organizationAdmin.api_user_id !== user.api_user_id) {
    return false;
  }

  if (organizationAdmin.role !== Role.OrganizationAdmin) {
    return false;
  }

  return true;
};