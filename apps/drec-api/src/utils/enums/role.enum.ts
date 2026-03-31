export enum Role {
  User = 'User',
  DeviceOwner = 'DeviceOwner',
  OrganizationAdmin = 'OrganizationAdmin',
  Buyer = 'Buyer',
  Admin = 'Admin',
  SubBuyer = 'SubBuyer',
  ApiUser = 'ApiUser',
  Reviewer = 'Reviewer',
  SeniorReviewer = 'SeniorReviewer',
  Operator = 'Operator',
}
export enum RoleStatus {
  Enable = 'Enable',
  Disable = 'Disable',
}
export enum EntityType {
  Role = 'Role',
  User = 'User',
}

export enum PermissionString {
  Read = 'Read',
  Delete = 'Delete',
  Update = 'Update',
  Write = 'Write',
}
