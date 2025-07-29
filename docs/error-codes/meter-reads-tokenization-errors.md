---
order: 5
---

# Meter Reads Tokenization Errors

This document outlines the various errors that can occur during the tokenization of meter reads in the D-REC platform.

## Token Generation

| Code | Title | Description |
|------|-------|-------------|
| E-5001 | Invalid Meter Read | The provided meter read data is invalid or incomplete. |
| E-5002 | Read Value Out of Range | The meter read value is outside the expected range. |
| E-5003 | Timestamp Invalid | The provided timestamp is invalid or in the future. |
| E-5004 | Duplicate Read | This meter read has already been tokenized. |

## Token Validation

| Code | Title | Description |
|------|-------|-------------|
| E-5101 | Invalid Token Format | The token format is invalid. |
| E-5102 | Token Expired | The token has expired and is no longer valid. |
| E-5103 | Token Already Used | This token has already been used. |
| E-5104 | Token Verification Failed | The token could not be verified. |

## Token Redemption

| Code | Title | Description |
|------|-------|-------------|
| E-5201 | Redemption Period Expired | The token redemption period has expired. |
| E-5202 | Invalid Redemption Request | The redemption request is invalid. |
| E-5203 | Insufficient Token Balance | There are not enough tokens for this redemption. |

## Error Response Example

```json
{
  "statusCode": 400,
  "message": "Invalid meter read data",
  "error": "E-5001",
  "timestamp": "2023-07-29T15:30:00.000Z",
  "path": "/api/meter-reads/tokenize"
}
```

## Related Documentation

- [Device Registration](./device-errors.md)
- [Authentication](./authentication.md)
- [User Management](./user-management-errors.md)
- [Permission Errors](./permission-errors.md)
