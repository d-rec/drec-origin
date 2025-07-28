---
order: 6
---

# API and Integration (E-5XXX)

This section documents error codes related to API usage, integration issues, and third-party service interactions.

## API Authentication & Authorization (E-5001 - E-5099)

| Code | Title | Description | HTTP Status |
|------|-------|-------------|--------------|
| E-5001 | Invalid API Key | The provided API key is invalid or malformed. | 401 Unauthorized |
| E-5002 | API Key Expired | The provided API key has expired. Please generate a new one. | 401 Unauthorized |
| E-5003 | IP Not Whitelisted | Your IP address is not whitelisted for API access. | 403 Forbidden |
| E-5004 | Rate Limit Exceeded | You have exceeded your API rate limit. Please wait before making more requests. | 429 Too Many Requests |
| E-5005 | Insufficient Scope | Your API key does not have the required permissions. | 403 Forbidden |
| E-5006 | API Key Revoked | Your API key has been revoked. Please contact support. | 401 Unauthorized |
| E-5007 | API Version Deprecated | The API version you are using is deprecated. Please upgrade. | 410 Gone |
| E-5008 | API Version Required | No API version was specified in the request. | 400 Bad Request |

## Request Validation (E-5100 - E-5199)

| Code | Title | Description | HTTP Status |
|------|-------|-------------|--------------|
| E-5100 | Invalid Request Body | The request body is malformed or invalid. | 400 Bad Request |
| E-5101 | Missing Required Field | A required field is missing from the request. | 400 Bad Request |
| E-5102 | Invalid Field Value | A field contains an invalid value. | 400 Bad Request |
| E-5103 | Invalid Query Parameter | A query parameter is invalid. | 400 Bad Request |
| E-5104 | Unsupported Media Type | The request's content type is not supported. | 415 Unsupported Media Type |
| E-5105 | Request Too Large | The request payload is too large. | 413 Payload Too Large |
| E-5106 | Invalid Date Range | The provided date range is invalid. | 400 Bad Request |
| E-5107 | Invalid Pagination | The pagination parameters are invalid. | 400 Bad Request |

## Resource Management (E-5200 - E-5299)

| Code | Title | Description | HTTP Status |
|------|-------|-------------|--------------|
| E-5200 | Resource Not Found | The requested resource could not be found. | 404 Not Found |
| E-5201 | Resource Conflict | The resource already exists or conflicts with an existing resource. | 409 Conflict |
| E-5202 | Resource Limit Reached | You have reached the maximum number of resources. | 403 Forbidden |
| E-5203 | Resource Locked | The resource is currently locked and cannot be modified. | 423 Locked |
| E-5204 | Resource State Invalid | The resource is not in a valid state for this operation. | 409 Conflict |
| E-5205 | Resource Deleted | The requested resource has been deleted. | 410 Gone |
| E-5206 | Resource Not Modified | The resource has not been modified since the last request. | 304 Not Modified |

## Integration Errors (E-5300 - E-5399)

| Code | Title | Description | HTTP Status |
|------|-------|-------------|--------------|
| E-5300 | Integration Error | An error occurred while processing the integration. | 500 Internal Server Error |
| E-5301 | Service Unavailable | The requested service is currently unavailable. | 503 Service Unavailable |
| E-5302 | Timeout | The request timed out while waiting for a response. | 504 Gateway Timeout |
| E-5303 | Invalid Response | The response from the external service was invalid. | 502 Bad Gateway |
| E-5304 | Webhook Delivery Failed | Failed to deliver the webhook notification. | 500 Internal Server Error |
| E-5305 | Webhook Configuration Error | The webhook configuration is invalid. | 400 Bad Request |
| E-5306 | Webhook Verification Failed | The webhook signature verification failed. | 401 Unauthorized |

## API Deprecation (E-5900 - E-5999)

| Code | Title | Description | HTTP Status |
|------|-------|-------------|--------------|
| E-5900 | API Version Deprecated | This API version is deprecated and will be removed. | 410 Gone |
| E-5901 | Endpoint Deprecated | This endpoint is deprecated and will be removed. | 410 Gone |
| E-5902 | Parameter Deprecated | This parameter is deprecated and will be removed. | 400 Bad Request |
| E-5903 | Feature Deprecated | This feature is deprecated and will be removed. | 400 Bad Request |
| E-5904 | Migration Required | A migration is required to continue using this API. | 426 Upgrade Required |

## Related Documentation

- [System and Authentication Errors (E-1XXX)](/error-codes/system-auth-errors)
- [User Management (E-2XXX)](/error-codes/user-management-errors)
- [Device and Meter Read Management (E-3XXX)](/error-codes/device-meter-errors)
- [Tokenization and Transactions (E-4XXX)](/error-codes/tokenization-errors)
- [System Maintenance (E-9XXX)](/error-codes/maintenance-errors)
