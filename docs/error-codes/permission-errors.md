---
order: 6
---

# Permission Errors (E-6XXX)

This document outlines the various permission-related errors that can be returned by the D-REC API when a user or application attempts to perform an unauthorized action.

## User Permissions

| Code   | Title                      | Description                                                    |
| ------ | -------------------------- | -------------------------------------------------------------- |
| E-6001 | Permission Denied          | You don't have permission to perform this action.              |
| E-6002 | Role Assignment Failed     | Failed to assign the specified role.                           |
| E-6003 | Invalid Role               | The specified role does not exist.                             |
| E-6004 | Role Update Not Allowed    | You don't have permission to modify this role.                 |
| E-6005 | Self Role Modification     | You cannot modify your own role.                               |
| E-6006 | Role Limit Reached         | The maximum number of users with this role has been reached.   |
| E-6007 | Unauthorized Module Access | You are not authorized to add or modify modules for this role. |
| E-6008 | Invalid Permission         | The requested permission is not available for this module.     |
| E-6009 | Duplicate Permission       | Permission for this module and role already exists.            |

## Organization Permissions

| Code   | Title                       | Description                                         |
| ------ | --------------------------- | --------------------------------------------------- |
| E-6101 | Organization Access Denied  | You don't have access to this organization.         |
| E-6102 | Organization Admin Required | Organization administrator privileges are required. |
| E-6103 | Organization Member Limit   | The organization has reached its member limit.      |
| E-6104 | Organization Suspended      | This organization has been suspended.               |

## Resource Permissions

| Code   | Title                        | Description                                            |
| ------ | ---------------------------- | ------------------------------------------------------ |
| E-6201 | Resource Access Denied       | You don't have permission to access this resource.     |
| E-6202 | Resource Modification Denied | You don't have permission to modify this resource.     |
| E-6203 | Resource Deletion Denied     | You don't have permission to delete this resource.     |
| E-6204 | Resource Creation Denied     | You don't have permission to create this resource.     |
| E-6205 | Module Not Found             | The requested module does not exist.                   |
| E-6206 | Invalid Module Permission    | The requested permission is not valid for this module. |
| E-6207 | Empty Permission Request     | No permission data was provided in the request.        |

## Error Response Example

```json
{
  "statusCode": 403,
  "message": "You don't have permission to perform this action",
  "error": "E-6001",
  "timestamp": "2023-07-29T16:54:58.000Z",
  "path": "/api/permissions"
}
```

## Common Scenarios

### Unauthorized Module Access (E-6007)

- **Cause**: User attempted to modify module permissions without proper authorization.
- **Solution**: Ensure the user has the necessary role (Admin or Organization Admin with appropriate scope) to modify module permissions.

### Invalid Permission (E-6008)

- **Cause**: The requested permission is not available for the specified module.
- **Solution**: Verify the permission name and ensure it's valid for the target module.

### Duplicate Permission (E-6009)

- **Cause**: Attempted to create a permission that already exists for the module and role.
- **Solution**: Check existing permissions before creating new ones, or update the existing permission instead.

### Module Not Found (E-6205)

- **Cause**: The specified module ID does not exist in the system.
- **Solution**: Verify the module ID and try again with a valid module identifier.

### Empty Permission Request (E-6207)

- **Cause**: The permission request was submitted without any permission data.
- **Solution**: Ensure the request includes the necessary permission details.

## Best Practices

- Always verify user permissions before performing sensitive operations
- Implement proper error handling for permission-related issues
- Log permission failures for security auditing
- Use the principle of least privilege when assigning permissions
- Regularly review and audit user permissions
- Implement proper validation for permission requests
- Provide clear error messages that don't expose sensitive information

## Related Documentation

- [Authentication](./authentication.md)
- [User Management](./user-management-errors.md)
- [Device Registration](./device-errors.md)
- [Meter Reads](./meter-reads-errors.md)
