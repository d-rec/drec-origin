---
order: 6
---

# Permission Errors

This document outlines the various permission-related errors that can be returned by the D-REC API when a user or application attempts to perform an unauthorized action.

## User Permissions

| Code | Title | Description |
|------|-------|-------------|
| E-6001 | Permission Denied | You don't have permission to perform this action. |
| E-6002 | Role Assignment Failed | Failed to assign the specified role. |
| E-6003 | Invalid Role | The specified role does not exist. |
| E-6004 | Role Update Not Allowed | You don't have permission to modify this role. |
| E-6005 | Self Role Modification | You cannot modify your own role. |
| E-6006 | Role Limit Reached | The maximum number of users with this role has been reached. |

## Organization Permissions

| Code | Title | Description |
|------|-------|-------------|
| E-6101 | Organization Access Denied | You don't have access to this organization. |
| E-6102 | Organization Admin Required | Organization administrator privileges are required. |
| E-6103 | Organization Member Limit | The organization has reached its member limit. |
| E-6104 | Organization Suspended | This organization has been suspended. |

## Resource Permissions

| Code | Title | Description |
|------|-------|-------------|
| E-6201 | Resource Access Denied | You don't have permission to access this resource. |
| E-6202 | Resource Modification Denied | You don't have permission to modify this resource. |
| E-6203 | Resource Deletion Denied | You don't have permission to delete this resource. |
| E-6204 | Resource Creation Denied | You don't have permission to create this resource. |

## Error Response Example

```json
{
  "statusCode": 403,
  "message": "You don't have permission to perform this action",
  "error": "E-6001",
  "timestamp": "2023-07-29T16:54:58.000Z",
  "path": "/api/organizations/123/members"
}
```

## Common Scenarios

### Insufficient Permissions
- **Permission Denied (E-6001)**: The user doesn't have the required permissions.
  - Solution: Contact your organization administrator to request the necessary permissions.

### Organization Access Issues
- **Organization Access Denied (E-6101)**: You're trying to access an organization you don't belong to.
  - Solution: Ensure you're using the correct organization ID or request access from an administrator.

## Best Practices
- Always check permissions before performing sensitive operations
- Implement proper error handling for permission-related errors
- Use the principle of least privilege when assigning roles
- Regularly audit user permissions and access levels

## Related Documentation

- [Authentication Errors](./authentication.md)
- [User Management](./user-management-errors.md)
- [Device Registration](./device-errors.md)
- [Meter Reads Tokenization](./meter-reads-tokenization-errors.md)
