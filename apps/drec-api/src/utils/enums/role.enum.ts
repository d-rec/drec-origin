export enum Role {
  User='User',
  DeviceOwner = 'DeviceOwner',
  OrganizationAdmin = 'OrganizationAdmin',
  Buyer = 'Buyer',
  Admin = 'Admin',
  SubBuyer = 'SubBuyer',
 // Intermediary = 'Intermediary',

}
export enum RoleStatus {
  Enable = 'Enable',
  Disable = 'Disable'
}
export enum EntityType {
  Role = 'Role',
  User = 'User'
}

export enum PermissionString {
    Read = 'Read',
    Delete = 'Delete',
    Update = 'Update',
    Write = 'Write',
  }