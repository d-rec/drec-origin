---
order: 3
---

# ACL Module

## ACL Module Documentation

### Auth Module

Auth ACL Module Name: **Not Required**

#### Auth API

- Login Api

### User Module

User ACL Module Name: **Not Required**

#### User API

1. GET user/me api which will get my own user details.

User's ACL Module Name: **USER_MANAGEMENT_CRUDL**

#### User's API

- Get user by id Api

- Register Api

- Update profile Api

- Update user’s own password Api

- Confirm-email Api

- Resend Confirm-email Api

Password ACL Module Name: **PASSWORD_MANAGEMENT_CRUDL**

#### Password API

- Reset Password Api

- Forget-password Api

### Admin Module

Admin ApiUser ACL Module Name: **ADMIN_APIUSER_ORGANIZATION_CRUDL**

#### Admin ApiUser API

- Get users api

Admin ACL Module Name: **ADMIN_MANAGEMENT_CRUDL**

#### Admin API

- Get all organizations Api

- Get all users of an organization Api

- Get an organization by Id

- Create users Api

- Seed users Api

- Seed organizations Api

- Update user by Id Api

- Update organization by Id

- Delete organization by Id

- Delete user by Id

- Add devices into IREC Api

- Get devices with autocomplete Api

- Get list of Apiusers Api

### Certificate Log Module

Certificate Log ACL Module Name: **CERTIFICATE_LOG_MANAGEMENT_CRUDL**

#### Certificate Log API

- Get all Api

- Get claim amount in ethers json Api

- Get certificate log by reservation groupId Api

- Get issuer certified by groupId Api

- Get issuer certified new by groupId Api

- Get redemption Report Api

- Get certificateReadModule Api

- Get issuer certificate log of devices Api

### Device Module

Device ACL Module Name: **DEVICE_MANAGEMENT_CRUDL**

#### Device API

- Get all device types Api

- Get all fuel types Api

Device's ACL Module Name: **DEVICE_MANAGEMENT_CRUDL**

#### Device's API

- Get All Api

- Get all ungrouped devices for buyer reservation Api

- Get all ungrouped devices Api

- Get my devices Api

- Get device by Id Api

- Get device by external Id Api

- Create device Api

- Update by external Id Api

- Delete device by Id

- Get my total amount Reads devices Api

- Update device onboarding date by Id Api

- Get my autocomplete Api

- Get certificate log first and last date Api

Device Bulk ACL Module Name: **DEVICE_BULK_MANAGEMENT_CRUDL**

#### Device Bulk API

- Add devices by admin, processing CSV file upload Api

### Device Group Module

Device Group ACL Module Name: **BUYER_RESERVATION_MANAGEMENT_CRUDL**

#### Device Group API

- Get my reservations Api

- Get reservation by Id Api

- Create reservation Api

- Process device bulk upload by csv Api

- Update reservation by Id Api

- Delete reservation by Id Api

- Get device group log by Id Api

- Delete / end reservation by Id Api

- Get current information of reservation by group Id Api

Device Bulk's ACL Module Name: **DEVICE_BULK_MANAGEMENT_CRUDL**

#### Device Bulk's API

- Get bulk upload status by Id Api

- Get all csv jobs of organization Api

### File Module

File ACL Module Name: **FILE_MANAGEMENT_CRUDL**

#### File API

- Upload files Api

- Get / Download file Api

### Invitation Module

Invitation ACL Module Name: **INVITATION_MANAGEMENT_CRUDL**

#### Invitation API

- Get all invitations Api

- Update an invitation by Id Api

- Invite user Api

### Drec-Issuer Module

Drec-Issuer ACL Module Name: **DREC_ISSUER_MANAGEMENT_CRUDL**

#### Drec-Issuer API

- Get ongoing Api

- Get history Api

- Reissue certificate Api

- Get late ongoing Api

### Organization Module

Organization ACL Module Name: **ORGANIZATION_MANAGEMENT_CRUDL**

#### Organization API

- Get my organization Api

- Get all organizations for sApi user Api

- Get organization users Api

- Get an organization by Id Api

- Get invitations by organization Id Api

- Create organization Api

- Update/Change the role of a user of an organization Api

- Set organization blockchain address Apic

### Permission Module

Permission ACL Module Name: **PERMISSION_MANAGEMENT_CRUDL**

#### Permission API

- Get all permissions Api

- Get list user role permissions Api

- Get list of user permission by Id Api

- Add permission Api

- Update permission by Id Api

- Request permission for Api User Api

- Verify or Approve permission for Api User by Admin Api

### Reads Module

Reads ACL Module Name: **READS_MANAGEMENT_CRUDL**

#### Reads API

- Get all valid time-zones Api

- Get meter reads by external Id Api

- Get meter reads by external Id / device Id new Api

- Create new meter reads by device Id Api

- Create new meter reads by device Id by admin Api

- Get latest read by external Id Api

### Yield Module

Yield ACL Module Name: **YIELD_CONFIG_MANAGEMENT_CRUDL**

#### Yield API

- Get all Api

- Get by Id Api

- Create Api

- Update by Id Api
