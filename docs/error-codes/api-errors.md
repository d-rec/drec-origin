---
title: API and Integration Errors
order: 6
---

# API and Integration Errors (4XX, 5XX)

This document outlines the various API and integration errors that can be returned by the D-REC API.

## Common API and Integration Errors

### 400 Bad Request

| Error Code | Message | Description |
|------------|---------|-------------|
| `API_400_001` | Invalid request body | The request body is malformed or invalid |
| `API_400_002` | Missing required field | A required field is missing from the request |
| `API_400_003` | Invalid field value | A field contains an invalid value |
| `API_400_004` | Invalid query parameter | A query parameter is invalid |
| `API_400_005` | Invalid request format | The request format is not supported |

### 401 Unauthorized

| Error Code | Message | Description |
|------------|---------|-------------|
| `API_401_001` | Invalid API key | The provided API key is invalid |
| `API_401_002` | API key expired | The provided API key has expired |
| `API_401_003` | Authentication required | No authentication credentials were provided |
| `API_401_004` | Invalid authentication credentials | The provided credentials are invalid |

### 403 Forbidden

| Error Code | Message | Description |
|------------|---------|-------------|
| `API_403_001` | IP not whitelisted | Your IP address is not whitelisted |
| `API_403_002` | Insufficient permissions | Your API key does not have the required permissions |
| `API_403_003` | API key revoked | Your API key has been revoked |

### 404 Not Found

| Error Code | Message | Description |
|------------|---------|-------------|
| `API_404_001` | Endpoint not found | The requested endpoint does not exist |
| `API_404_002` | Resource not found | The requested resource could not be found |
| `API_404_003` | Version not found | The requested API version does not exist |

### 415 Unsupported Media Type

| Error Code | Message | Description |
|------------|---------|-------------|
| `API_415_001` | Unsupported content type | The request's content type is not supported |
| `API_415_002` | Unsupported accept header | The requested content type is not supported |
| `API_415_003` | Invalid content type | The content type is not valid for this endpoint |

### 422 Unprocessable Entity

| Error Code | Message | Description |
|------------|---------|-------------|
| `API_422_001` | Validation failed | The request failed validation |
| `API_422_002` | Invalid input data | The provided input data is invalid |
| `API_422_003` | Business rule violation | The request violates business rules |

### 429 Too Many Requests

| Error Code | Message | Description |
|------------|---------|-------------|
| `API_429_001` | Rate limit exceeded | You have exceeded your API rate limit |
| `API_429_002` | Too many requests | Too many requests from this IP address |
| `API_429_003` | Request throttled | Your request has been throttled |

### 500 Internal Server Error

| Error Code | Message | Description |
|------------|---------|-------------|
| `API_500_001` | Internal server error | An unexpected error occurred |
| `API_500_002` | Service unavailable | The service is currently unavailable |
| `API_500_003` | Database error | An error occurred while accessing the database |

### 503 Service Unavailable

| Error Code | Message | Description |
|------------|---------|-------------|
| `API_503_001` | Service temporarily unavailable | The service is temporarily unavailable |
| `API_503_002` | Maintenance in progress | The service is currently undergoing maintenance |
| `API_503_003` | Service overloaded | The service is currently overloaded |

## Error Response Example

```json
{
  "statusCode": 400,
  "message": "Invalid request body",
  "error": "API_400_001",
  "timestamp": "2023-07-28T16:30:00.000Z",
  "path": "/api/endpoint"
}
```

## Common Scenarios

### Authentication Issues

- **Invalid API Key** (`API_401_001`): The provided API key is invalid.
  - Solution: Verify your API key and ensure it's correctly formatted.

- **IP Not Whitelisted** (`API_403_001`): Your IP address is not whitelisted.
  - Solution: Contact support to add your IP address to the whitelist.

### Rate Limiting

- **Rate Limit Exceeded** (`API_429_001`): You've exceeded your API rate limit.
  - Solution: Wait for the rate limit to reset or contact support to increase your limit.
  
- **Request Throttled** (`API_429_003`): Your request has been throttled.
  - Solution: Reduce your request rate and implement exponential backoff.

## Best Practices

- Always include proper error handling in your API client
- Implement retry logic with exponential backoff for transient errors
- Cache responses when appropriate to reduce API calls
- Follow the principle of least privilege for API key permissions
- Monitor your API usage and set up alerts for rate limits

## Rate Limiting

All API endpoints are subject to rate limiting to ensure fair usage. The following headers are included in rate-limited responses:

- `X-RateLimit-Limit`: Maximum requests allowed in the time window
- `X-RateLimit-Remaining`: Requests remaining in the current window
- `X-RateLimit-Reset`: Time when the rate limit window resets (UTC epoch seconds)
- `Retry-After`: Recommended time to wait before making another request (in seconds)

## Security Considerations

- Never expose your API keys in client-side code or public repositories
- Use environment variables to store sensitive credentials
- Implement proper input validation on the client side
- Use HTTPS for all API requests
- Regularly rotate your API keys and audit their usage
- Monitor your API usage for suspicious activity

## Related Documentation

- [System and Authentication Errors (E-1XXX)](/error-codes/system-auth-errors)
- [User Management (E-2XXX)](/error-codes/user-management-errors)
- [Device and Meter Read Management (E-3XXX)](/error-codes/device-meter-errors)
- [Tokenization and Transactions (E-4XXX)](/error-codes/tokenization-errors)
- [System Maintenance (E-9XXX)](/error-codes/maintenance-errors)
