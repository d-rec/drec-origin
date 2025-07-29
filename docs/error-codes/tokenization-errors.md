---
title: Tokenization and Transaction Errors
order: 5
---

# Tokenization and Transaction Errors

This document outlines the various tokenization and transaction errors that can be returned by the D-REC API.

## Common Tokenization and Transaction Errors

### 400 Bad Request

| Code | Title | Description |
|------|-------|-------------|
| `TOKEN_400_001` | Invalid token format | The provided token format is invalid |
| `TOKEN_400_002` | Invalid transaction amount | The specified transaction amount is invalid |
| `TOKEN_400_003` | Missing required fields | One or more required transaction fields are missing |
| `TOKEN_400_004` | Invalid token type | The specified token type is not supported |
| `TOKEN_400_005` | Invalid transaction parameters | One or more transaction parameters are invalid |

### 401 Unauthorized

| Code | Title | Description |
|------|-------|-------------|
| `TOKEN_401_001` | Token expired | The token has expired and is no longer valid |
| `TOKEN_401_002` | Invalid token | The provided token is invalid or malformed |
| `TOKEN_401_003` | Token scope mismatch | The token does not have the required scope |

### 402 Payment Required

| Code | Title | Description |
|------|-------|-------------|
| `TOKEN_402_001` | Insufficient balance | Your account has insufficient balance for this transaction |
| `TOKEN_402_002` | Payment method required | A valid payment method is required to complete this transaction |
| `TOKEN_402_003` | Transaction limit exceeded | The transaction amount exceeds your allowed limit |

### 403 Forbidden

| Code | Title | Description |
|------|-------|-------------|
| `TOKEN_403_001` | Token redemption restricted | Token redemption is currently restricted |
| `TOKEN_403_002` | Transaction not allowed | The requested transaction is not allowed |
| `TOKEN_403_003` | Token generation restricted | Token generation is currently restricted for this account |

### 404 Not Found

| Code | Title | Description |
|------|-------|-------------|
| `TOKEN_404_001` | Token not found | The specified token could not be found |
| `TOKEN_404_002` | Transaction not found | The specified transaction could not be found |
| `TOKEN_404_003` | Token batch not found | The specified token batch could not be found |

### 409 Conflict

| Code | Title | Description |
|------|-------|-------------|
| `TOKEN_409_001` | Token already used | This token has already been used |
| `TOKEN_409_002` | Duplicate transaction | A transaction with these details already exists |
| `TOKEN_409_003` | Token batch conflict | The token batch is in an invalid state for this operation |

### 422 Unprocessable Entity

| Code | Title | Description |
|------|-------|-------------|
| `TOKEN_422_001` | Token validation failed | The token failed validation checks |
| `TOKEN_422_002` | Transaction validation failed | The transaction failed validation checks |
| `TOKEN_422_003` | Token batch validation failed | The token batch failed validation checks |

## Error Response Example

```json
{
  "statusCode": 400,
  "message": "Invalid token format",
  "error": "TOKEN_400_001",
  "timestamp": "2023-07-28T16:30:00.000Z",
  "path": "/api/tokens/generate"
}
```

## Common Scenarios

### Token Generation

- **Token Generation Restricted** (`TOKEN_403_003`): Your account is not allowed to generate tokens.
  - Solution: Contact support to enable token generation for your account.

- **Invalid Token Type** (`TOKEN_400_004`): The specified token type is not supported.
  - Solution: Check the list of supported token types and resubmit.

### Transaction Processing

- **Insufficient Balance** (`TOKEN_402_001`): Your account doesn't have enough balance.
  - Solution: Add funds to your account or reduce the transaction amount.
  
- **Token Already Used** (`TOKEN_409_001`): The token has already been redeemed.
  - Solution: Generate a new token for this transaction.

## Best Practices

- Always validate tokens before processing transactions
- Implement proper error handling in your application
- Log detailed error information for auditing
- Follow the principle of least privilege for token permissions
- Regularly audit token usage and access patterns

## Rate Limiting

Tokenization and transaction endpoints are subject to rate limiting to prevent abuse. You may encounter a `429 Too Many Requests` response if you exceed the allowed number of requests. The following headers are included in rate-limited responses:

- `X-RateLimit-Limit`: Maximum requests allowed in the time window
- `X-RateLimit-Remaining`: Requests remaining in the current window
- `X-RateLimit-Reset`: Time when the rate limit window resets (UTC epoch seconds)

## Security Considerations

- Never expose tokens in client-side code or logs
- Use secure communication protocols (HTTPS) for all API requests
- Implement proper token validation and verification
- Regularly rotate API keys and access tokens
- Monitor for suspicious token usage patterns

## Related Documentation

- [System and Authentication Errors](./system-auth-errors.md)
- [User Management](./user-management-errors.md)
- [Device and Meter Read Management](./device-meter-errors.md)
- [API and Integration](./api-errors.md)
- [System Maintenance](./maintenance-errors.md)
