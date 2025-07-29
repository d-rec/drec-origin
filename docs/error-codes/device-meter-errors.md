---
title: Device and Meter Read Management Errors
order: 3
---

# Device and Meter Read Management Errors

This document outlines the various device and meter read management errors that can be returned by the D-REC API.

## Common Device and Meter Read Errors

### 400 Bad Request

| Code | Title | Description |
|------|-------|-------------|
| `DEVICE_400_001` | Invalid device identifier | The provided device identifier is malformed or invalid |
| `DEVICE_400_002` | Invalid device type | The specified device type is not supported |
| `DEVICE_400_003` | Invalid meter read value | The provided meter read value is invalid or out of range |
| `DEVICE_400_004` | Missing required fields | One or more required device fields are missing |
| `DEVICE_400_005` | Invalid location data | The provided location data is invalid or incomplete |

### 401 Unauthorized

| Code | Title | Description |
|------|-------|-------------|
| `DEVICE_401_001` | Unauthorized device access | The device is not authorized to perform this action |
| `DEVICE_401_002` | Invalid device credentials | The provided device credentials are invalid |

### 403 Forbidden

| Code | Title | Description |
|------|-------|-------------|
| `DEVICE_403_001` | Device registration limit reached | Maximum number of devices reached for this account |
| `DEVICE_403_002` | Device inactive | The device is currently inactive |
| `DEVICE_403_003` | Operation not allowed | The requested operation is not allowed for this device |

### 404 Not Found

| Code | Title | Description |
|------|-------|-------------|
| `DEVICE_404_001` | Device not found | The specified device could not be found |
| `DEVICE_404_002` | Meter read not found | The specified meter read could not be found |
| `DEVICE_404_003` | Device type not found | The specified device type does not exist |

### 409 Conflict

| Code | Title | Description |
|------|-------|-------------|
| `DEVICE_409_001` | Device already exists | A device with this identifier already exists |
| `DEVICE_409_002` | Duplicate meter read | A meter read with these details already exists |
| `DEVICE_409_003` | Device already registered | This device is already registered to another account |

### 422 Unprocessable Entity

| Code | Title | Description |
|------|-------|-------------|
| `DEVICE_422_001` | Invalid meter read sequence | The meter read is out of sequence |
| `DEVICE_422_002` | Meter read too high | The meter read exceeds expected maximum value |
| `DEVICE_422_003` | Meter read too low | The meter read is lower than previous reading |

## Error Response Example

```json
{
  "statusCode": 400,
  "message": "Invalid device identifier",
  "error": "DEVICE_400_001",
  "timestamp": "2023-07-28T16:30:00.000Z",
  "path": "/api/devices/register"
}
```

## Common Scenarios

### Device Registration

- **Device Already Exists** (`DEVICE_409_001`): The device identifier is already in use.
  - Solution: Use a different identifier or update the existing device.

- **Invalid Device Type** (`DEVICE_400_002`): The specified device type is not supported.
  - Solution: Check the list of supported device types and resubmit.

### Meter Read Submission

- **Meter Read Too High** (`DEVICE_422_002`): The submitted reading is unusually high.
  - Solution: Verify the reading and resubmit if correct.
  
- **Meter Read Out of Sequence** (`DEVICE_422_001`): The reading is not in sequence.
  - Solution: Check your device's timestamp synchronization.

## Best Practices

- Always validate device data before submission
- Implement proper error handling in your device firmware
- Log detailed error information for debugging
- Follow the principle of least privilege for device permissions
- Regularly update device firmware to the latest version

## Rate Limiting

Device and meter read endpoints are subject to rate limiting to prevent abuse. You may encounter a `429 Too Many Requests` response if you exceed the allowed number of requests. The following headers are included in rate-limited responses:

- `X-RateLimit-Limit`: Maximum requests allowed in the time window
- `X-RateLimit-Remaining`: Requests remaining in the current window
- `X-RateLimit-Reset`: Time when the rate limit window resets (UTC epoch seconds)

## Security Considerations

- Never expose device credentials in client-side code
- Use secure communication protocols (HTTPS, MQTT with TLS)
- Implement proper device authentication and authorization
- Regularly rotate device credentials
- Monitor for suspicious device activity

## Related Documentation

- [System and Authentication Errors (E-1XXX)](/error-codes/system-auth-errors)
- [User Management (E-2XXX)](/error-codes/user-management-errors)
- [Tokenization and Transactions (E-4XXX)](/error-codes/tokenization-errors)
- [API and Integration (E-5XXX)](/error-codes/api-errors)
- [System Maintenance (E-9XXX)](/error-codes/maintenance-errors)
