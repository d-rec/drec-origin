---
order: 4
---

# Device Registration Errors

This document outlines the various device registration and management errors that can be returned by the D-REC API.

## Device Registration

| Code | Title | Description |
|------|-------|-------------|
| E-3001 | Device already registered | A device with this identifier is already registered. Try to change the Serial Number. |
| E-3002 | Invalid country code | The specified country code is not supported. |
| E-3003 | Invalid Serial Number | serialNumber must contain only letters, numbers, underscores, or hyphens — no spaces allowed. |
| E-3004 | Invalid Commissioning Date | Commissioning date cannot be in the future. |
| E-3005 | There is a device with matching details | There is a device with matching details. The device is matching details with one of the already registered device. Try to change the Serial Number, Latitude, Longitude, Commissioning Date, Capacity. |
| E-3006 | Invalid Device Date format | The specified device date format is not supported. |

## Device Registration Bulk Upload

| Code | Title | Description |
|------|-------|-------------|
| E-3101 | Unsupported file format | The uploaded file is not in the correct format. |
| E-3102 | File not found | The uploaded file is not found. |
| E-3103 | File upload failed | The file upload failed due to invalid file format or size. |

## Error Response Example

```json
{
  "statusCode": 400,
  "message": "Device already registered",
  "error": "E-3001",
  "timestamp": "2023-07-29T15:00:00.000Z",
  "path": "/api/devices/register"
}
```

## Related Documentation

- [Authentication Errors](./authentication.md)
- [Meter Reads Tokenization](./meter-reads-tokenization-errors.md)
- [User Management](./user-management-errors.md)
- [Permission Errors](./permission-errors.md)
