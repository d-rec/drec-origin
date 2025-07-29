---
order: 2
---

# Authentication Errors (E-1XXX)

This section documents error codes related to system-level issues and authentication problems.

## Authentication Errors (E-1XXX)

| Code | Title | Description |
|------|-------|-------------|
| E-1001 | Invalid Credentials | The provided username or password is incorrect. Please verify your credentials and try again. |
| E-1002 | Session Expired | Your session has expired. Please log in again to continue. |
| E-1003 | Accept Terms and Conditions | You must accept the terms and conditions to continue. |
| E-1004 | Verify your email | Please verify your email address to continue. |
| E-1005 | Verify phone number | Please verify your phone number to continue. |
| E-1006 | Verify your organization | Please verify your organization to continue. |

## Related Documentation

- [User Management Errors (E-2XXX)](/error-codes/user-management-errors)
- [Device and Meter Read Management (E-3XXX)](/error-codes/device-meter-errors)
- [Tokenization and Transactions (E-4XXX)](/error-codes/tokenization-errors)
- [API and Integration (E-5XXX)](/error-codes/api-errors)
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
