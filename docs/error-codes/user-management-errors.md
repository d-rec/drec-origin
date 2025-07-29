---
order: 4
---

# User Management Errors

This section documents error codes related to user registration, authentication, and account management.

## User Registration

| Code | Title | Description |
|------|-------|-------------|
| E-2001 | User Exists | An account or user with this email address already exists. Please use a different email. |
| E-2002 | Organization Exists | An organization with this name already exists. Please use a different name. |
| E-2003 | Phone Number Registered | A user with this phone number already exists. Please use a different phone number. |
| E-2004 | Registration Timeout | The registration process has timed out. Please start again. |

## User Verification

| Code | Title | Description |
|------|-------|-------------|
| E-2100 | Invalid Email Token | The email confirmation token is invalid or has expired. Please verify your email address before proceeding. |

## User Permissions

| Code | Title | Description |
|------|-------|-------------|
| E-2300 | Permission Denied | You don't have permission to perform this action. |
| E-2301 | Role Assignment Failed | Failed to assign the specified role. |
| E-2302 | Invalid Role | The specified role does not exist. |
| E-2303 | Role Update Not Allowed | You don't have permission to modify this role. |
| E-2304 | Self Role Modification | You cannot modify your own role. |
| E-2305 | Role Limit Reached | The maximum number of users with this role has been reached. |

## Related Documentation

- [System and Authentication Errors](./system-auth-errors.md)
- [Device and Meter Read Management](./device-meter-errors.md)
- [Tokenization and Transactions](./tokenization-errors.md)
- [API and Integration](./api-errors.md)
- [System Maintenance](./maintenance-errors.md)

## Error Response Example

```json
{
  "statusCode": 400,
  "message": "User with this email already exists",
  "error": "E-2001",
  "timestamp": "2023-07-29T12:00:00.000Z",
  "path": "/api/users/register"
}
