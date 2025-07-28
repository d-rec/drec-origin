---
title: System and Authentication Errors
order: 2
---

# System and Authentication Errors (E-1XXX)

This section documents error codes related to system-level issues and authentication problems.

## Authentication Errors (E-1001 - E-1099)

| Code | Title | Description | HTTP Status |
|------|-------|-------------|--------------|
| E-1001 | Invalid Credentials | The provided username or password is incorrect. Please verify your credentials and try again. | 401 Unauthorized |
| E-1002 | Session Expired | Your session has expired. Please log in again to continue. | 401 Unauthorized |
| E-1003 | Account Locked | Your account has been temporarily locked due to multiple failed login attempts. Please try again in 30 minutes or contact support. | 403 Forbidden |
| E-1004 | Token Expired | The authentication token has expired. Please log in again to obtain a new token. | 401 Unauthorized |
| E-1005 | Invalid Token | The provided authentication token is invalid or malformed. | 401 Unauthorized |
| E-1006 | Two-Factor Required | Two-factor authentication is required for this account. | 403 Forbidden |
| E-1007 | Two-Factor Invalid | The provided two-factor authentication code is invalid or has expired. | 403 Forbidden |
| E-1008 | SSO Authentication Failed | Single Sign-On authentication failed. Please try again or contact your system administrator. | 401 Unauthorized |

## System Errors (E-1100 - E-1199)

| Code | Title | Description | HTTP Status |
|------|-------|-------------|--------------|
| E-1100 | Internal Server Error | An unexpected error occurred on the server. Our team has been notified. Please try again later. | 500 Internal Server Error |
| E-1101 | Service Unavailable | The service is currently unavailable due to maintenance or high load. Please try again later. | 503 Service Unavailable |
| E-1102 | Rate Limit Exceeded | Too many requests have been made from your IP address. Please wait before trying again. | 429 Too Many Requests |
| E-1103 | Database Connection Error | Unable to connect to the database. Please try again later. | 500 Internal Server Error |
| E-1104 | File System Error | An error occurred while accessing the file system. Please try again or contact support. | 500 Internal Server Error |
| E-1105 | Configuration Error | The system configuration is invalid. Please contact your system administrator. | 500 Internal Server Error |
| E-1106 | Maintenance Mode | The system is currently in maintenance mode. Please try again later. | 503 Service Unavailable |

## API Errors (E-1200 - E-1299)

| Code | Title | Description | HTTP Status |
|------|-------|-------------|--------------|
| E-1200 | Invalid Request | The request could not be understood by the server. Please verify your request and try again. | 400 Bad Request |
| E-1201 | Unsupported Media Type | The request entity has a media type which the server does not support. | 415 Unsupported Media Type |
| E-1202 | Method Not Allowed | The requested method is not supported for the specified resource. | 405 Method Not Allowed |
| E-1203 | Not Acceptable | The server cannot produce a response matching the list of acceptable values defined in the request's headers. | 406 Not Acceptable |
| E-1204 | Request Timeout | The server timed out waiting for the request. | 408 Request Timeout |

## Deprecation Notices (E-1900 - E-1999)

| Code | Title | Description | HTTP Status |
|------|-------|-------------|--------------|
| E-1900 | API Version Deprecated | The API version you are using is deprecated. Please upgrade to the latest version. | 410 Gone |
| E-1901 | Endpoint Deprecated | This endpoint is deprecated and will be removed in a future release. Please refer to the API documentation for the recommended alternative. | 410 Gone |

## Related Documentation

- [User Management Errors (E-2XXX)](/error-codes/user-management-errors)
- [Device and Meter Read Management (E-3XXX)](/error-codes/device-meter-errors)
- [Tokenization and Transactions (E-4XXX)](/error-codes/tokenization-errors)
- [API and Integration (E-5XXX)](/error-codes/api-errors)
- [System Maintenance (E-9XXX)](/error-codes/maintenance-errors)

## Authentication & Authorization Errors (4XX)

This document outlines the various authentication and authorization errors that can be returned by the D-REC API.

### 400 Bad Request

| Error Code | Message | Description |
|------------|---------|-------------|
| `AUTH_400_001` | Invalid authentication credentials | The provided authentication credentials are invalid or malformed |
| `AUTH_400_002` | Invalid request parameters | Required authentication parameters are missing or invalid |
| `AUTH_400_003` | Unsupported grant type | The specified OAuth grant type is not supported |

### 401 Unauthorized

| Error Code | Message | Description |
|------------|---------|-------------|
| `AUTH_401_001` | Invalid or expired token | The provided access token is invalid, expired, or revoked |
| `AUTH_401_002` | Authentication required | No authentication credentials were provided |
| `AUTH_401_003` | Invalid client credentials | The provided client credentials are invalid |
| `AUTH_401_004` | Account not verified | The user account has not been verified yet |

### 403 Forbidden

| Error Code | Message | Description |
|------------|---------|-------------|
| `AUTH_403_001` | Insufficient permissions | The authenticated user doesn't have permission to access this resource |
| `AUTH_403_002` | Account suspended | The user account has been suspended |
| `AUTH_403_003` | IP address not allowed | The request originated from a restricted IP address |

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

## Troubleshooting

### Common Issues

1. **Invalid Token**
   - Ensure the token is correctly formatted and hasn't expired
   - Verify the token is being sent in the `Authorization` header as `Bearer <token>`

2. **Missing Permissions**
   - Check that your API key or user account has the required permissions
   - Contact your system administrator if you believe you should have access

3. **Account Not Verified**
   - Complete the email verification process if you haven't already
   - Check your email for a verification link or request a new one

### Recommended Actions

- For token-related issues, try refreshing your access token
- Ensure your system clock is synchronized (NTP recommended)
- Verify that your API client is using the correct authentication method
- Check the [API documentation](https://dev-api.drecs.org/docs) for the specific endpoint requirements

## Rate Limiting

The API enforces rate limiting to ensure fair usage. If you exceed the allowed number of requests, you may receive a `429 Too Many Requests` response. The following headers are included in rate-limited responses:

- `X-RateLimit-Limit`: The maximum number of requests allowed in the time window
- `X-RateLimit-Remaining`: The number of requests remaining in the current window
- `X-RateLimit-Reset`: The time at which the current rate limit window resets (in UTC epoch seconds)

## Security Best Practices

- Never expose your API keys or access tokens in client-side code
- Use environment variables to store sensitive credentials
- Implement proper error handling to gracefully handle authentication failures
- Regularly rotate your API keys and access tokens
- Use the principle of least privilege when assigning permissions
