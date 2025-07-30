---
order: 1
---

# D-REC API Error Codes

This document provides a comprehensive reference for all error codes that can be returned by the D-REC API. Each error includes an error code and a descriptive message.

## Error Response Format

All error responses from the D-REC API follow a consistent JSON structure:

```json
{
  "statusCode": 400,
  "message": "Detailed error message",
  "error": "Error type or code",
  "timestamp": "2023-07-28T16:30:00.000Z",
  "path": "/api/endpoint"
}
```

## Error Categories

Errors are grouped by the API component that generates them:

1. [Authentication & Authorization](./authentication.md) - Errors related to user authentication and permissions
2. [User Management](./user-management-errors.md) - Errors related to user accounts and profiles
3. [Device Registration](./device-errors.md) - Errors related to device registration and management
4. [Meter Reads](./meter-reads-errors.md) - Errors related to meter reading operations
5. [Permissions](./permission-errors.md) - Errors related to user permissions and access control

## Common HTTP Status Codes

- `400 Bad Request` - The request was invalid or cannot be served
- `401 Unauthorized` - Authentication is required and has failed or has not been provided
- `403 Forbidden` - The server understood the request but refuses to authorize it
- `404 Not Found` - The requested resource could not be found
- `409 Conflict` - Request conflicts with the current state of the server
- `422 Unprocessable Entity` - The request was well-formed but unable to be followed due to semantic errors
- `500 Internal Server Error` - A generic error occurred on the server

## Handling Errors

When your application receives an error response:

1. Check the HTTP status code to determine the general category of error
2. Read the error message for specific details about what went wrong
3. If the error is persistent, check the API documentation or contact support
4. For 5xx errors, retry the request after a short delay

## Best Practices

- Always implement proper error handling in your client applications
- Display user-friendly error messages based on the error code
- Log detailed error information for debugging purposes
- Implement retry logic for transient errors (5xx status codes)
- Keep your API client up to date to ensure compatibility with error responses
