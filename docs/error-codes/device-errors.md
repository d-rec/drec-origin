---
order: 4
---

# Device Registration Errors (E-4XXX)

This document outlines the various device registration and management errors that can be returned by the D-REC API.

## Device Registration

| Code   | Title                                   | Description                                                                                                                                                                                            |
| ------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| E-3001 | Device already registered               | A device with this identifier is already registered. Try to change the Serial Number.                                                                                                                  |
| E-3002 | Invalid country code                    | The specified country code is not supported.                                                                                                                                                           |
| E-3003 | Invalid Serial Number                   | serialNumber must contain only letters, numbers, underscores, or hyphens — no spaces allowed.                                                                                                          |
| E-3004 | Invalid Commissioning Date              | Commissioning date cannot be in the future.                                                                                                                                                            |
| E-3005 | There is a device with matching details | There is a device with matching details. The device is matching details with one of the already registered device. Try to change the Serial Number, Latitude, Longitude, Commissioning Date, Capacity. |
| E-3006 | Invalid Device Date format              | The specified device date format is not supported.                                                                                                                                                     |

## Device Registration Bulk Upload

| Code   | Title                   | Description                                                |
| ------ | ----------------------- | ---------------------------------------------------------- |
| E-3101 | Unsupported file format | The uploaded file is not in the correct format.            |
| E-3102 | File not found          | The uploaded file is not found.                            |
| E-3103 | File upload failed      | The file upload failed due to invalid file format or size. |

## Common Scenarios

### Device Already Registered (E-3001)

- **Cause**: The device's serial number is already in use in the system.
- **Solution**: Verify the serial number or contact support if you believe this is an error.

### Invalid Serial Number (E-3003)

- **Cause**: The serial number contains invalid characters or spaces.
- **Solution**: Use only letters, numbers, underscores, or hyphens in the serial number.

### Commissioning Date in Future (E-3004)

- **Cause**: The provided commissioning date is set to a future date.
- **Solution**: Ensure the commissioning date is not in the future.

### Duplicate Device Details (E-3005)

- **Cause**: Another device with identical details already exists.
- **Solution**: Verify all device details, especially serial number and location.

## Best Practices

- **Pre-validate Device Data**: Ensure all device details meet requirements before submission.
- **Use Bulk Upload for Multiple Devices**: For registering multiple devices, use the bulk upload feature.
- **Verify Serial Number Uniqueness**: Check that the serial number isn't already in use.
- **Check Date Formats**: Ensure all dates are in the correct format (ISO 8601).
- **Review Error Responses**: Always check the error message and code for specific resolution steps.
- **Maintain Device Records**: Keep an updated record of all registered devices and their details.
- **Regular Audits**: Periodically verify device information for accuracy and completeness.

## Related Documentation

- [Authentication](./authentication.md)
- [User Management](./user-management-errors.md)
- [Meter Reads](./meter-reads-errors.md)
- [Permissions](./permission-errors.md)
