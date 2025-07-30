---
order: 2
---

# Authentication Error Codes (E-1XXX)

This section documents error codes related to system-level issues and authentication problems.

## Authentication Error Codes

| Code | Title | Description |
|------|-------|-------------|
| E-1001 | Invalid Credentials | The provided username or password is incorrect. Please verify your credentials and try again. |
| E-1002 | Session Expired | Your session has expired. Please log in again to continue. |
| E-1003 | Accept Terms and Conditions | You must accept the terms and conditions to continue. |
| E-1004 | Verify your email | Please verify your email address to continue. |
| E-1005 | Verify phone number | Please verify your phone number to continue. |
| E-1006 | Verify your organization | Please verify your organization to continue. |

## Related Documentation

- [User Management Errors (E-2XXX)](./user-management-errors.md)
- [Device Registration Errors (E-4XXX)](./device-errors.md)
- [Meter Reads Errors (E-5XXX)](./meter-reads-errors.md)
- [Permission Errors (E-6XXX)](./permission-errors.md)
- [System Maintenance (E-9XXX)](/error-codes/maintenance-errors)

## Error Response Example
  
```json
{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "error": "AUTH_401_001",
  "timestamp": "2023-07-28T16:30:00.000Z",
  "path": "/api/protected-resource"
}
```
