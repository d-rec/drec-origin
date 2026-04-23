export enum Role {
  User = 'User',

  Buyer = 'Buyer',
  Admin = 'Admin',
  SubBuyer = 'SubBuyer',
  Registrant = 'Registrant',
  Reviewer = 'Reviewer',
  SeniorReviewer = 'SeniorReviewer',
  SiteOperator = 'SiteOperator',
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
