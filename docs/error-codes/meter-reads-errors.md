---
order: 5
---

# Meter Reads Errors (E-5XXX)

This document outlines the various errors that can occur when working with meter reads in the D-REC platform, including validation, submission, and processing errors.

## Meter Read Submission

| Code | Title | Description |
|------|-------|-------------|
| E-5001 | Invalid Meter Read | The provided meter read data is invalid or incomplete. |
| E-5002 | Missing Timestamps | Start Date and/or End Date values are missing for History meter read type. Both are required. |
| E-5003 | Invalid Timestamp Format | The timestamp format is invalid. Must be in ISO 8601 format (YYYY-MM-DDThh:mm:ss.millisecondsZ). |
| E-5004 | Duplicate Read | This meter read has already been submitted. |
| E-5005 | Invalid Device | The specified device does not exist or is not active. |
| E-5006 | Invalid Timestamp Order | Start timestamp must be before end timestamp. |
| E-5007 | Onboarding Date Violation | Timestamps must be after the device's onboarding date. |
| E-5008 | Commissioning Date Violation | Timestamps must be after the device's commissioning date. |
| E-5009 | Future Timestamp | Timestamps cannot be in the future. |
| E-5010 | Invalid Read Value | Meter read value must be greater than 0. |
| E-5011 | System Date Violation | Timestamps cannot be after the current system date. |
| E-5012 | Empty Device ID | Device ID cannot be empty. |
| E-5013 | Invalid Accumulation Type | The provided accumulation type is not valid. Must be 'Monthly' or 'Yearly'. |
| E-5014 | No Reads Found | No meter reads found for the specified criteria. |
| E-5015 | Multiple Reads Not Allowed | Cannot process multiple reads simultaneously. |
| E-5016 | Organization Mismatch | The device does not belong to the requesting user's organization. |

## Meter Read Processing

| Code | Title | Description |
|------|-------|-------------|
| E-5201 | Processing Error | An error occurred while processing the meter read. |
| E-5202 | Calculation Error | Could not calculate energy generation from the meter read. |
| E-5203 | Data Inconsistency | The meter read is inconsistent with previous readings. |
| E-5204 | Device Inactive | The device is not active for the specified date range. |

## Meter Read Retrieval

| Code | Title | Description |
|------|-------|-------------|
| E-5301 | Invalid Device ID | The specified device ID is invalid or does not exist. |
| E-5302 | Read Not found | The specified read is not found. |
| E-5303 | Market Intermediary Can't View | The market intermediary can't view the reads of other market intermediaries. |
| E-5304 | Organization Admin Can't View | The organization admin can't view the reads of other organizations. |
| E-5305 | Invalid Read Type | The read type is invalid. |
| E-5306 | Invalid Organization ID | The organization ID is invalid. |

## Error Response Example

```json
{
  "statusCode": 400,
  "message": "Invalid meter read data",
  "error": "E-5001",
  "timestamp": "2023-07-29T19:34:21+02:00",
  "path": "/api/meter-reads"
}
```

## Common Scenarios

### Missing Required Timestamps (E-5002)
- **Cause**: Start Date and/or End Date values are missing for a History meter read type.
- **Solution**: Ensure both start and end timestamps are provided for History type reads.

### Invalid Timestamp Format (E-5003)
- **Cause**: Timestamp is not in the required ISO 8601 format.
- **Solution**: Format timestamps as `YYYY-MM-DDThh:mm:ss.millisecondsZ` (e.g., 2022-10-18T11:35:27.640Z).

### Invalid Timestamp Order (E-5006)
- **Cause**: Start timestamp is after the end timestamp.
- **Solution**: Ensure start timestamp is always before end timestamp.

### Onboarding Date Violation (E-5007)
- **Cause**: Read timestamps are before the device's onboarding date.
- **Solution**: Check the device's onboarding date and adjust timestamps accordingly.

### Commissioning Date Violation (E-5008)
- **Cause**: Read timestamps are before the device's commissioning date.
- **Solution**: Ensure timestamps are after the device's commissioning date.

### Future Timestamp (E-5009)
- **Cause**: Read timestamp is in the future.
- **Solution**: Use current or past timestamps only.

### Invalid Read Value (E-5010)
- **Cause**: Meter read value is not greater than 0.
- **Solution**: Provide a positive numerical value for the meter reading.

### Empty Device ID (E-5012)
- **Cause**: The device ID was not provided or is empty.
- **Solution**: Provide a valid device ID.

### Invalid Accumulation Type (E-5013)
- **Cause**: The provided accumulation type is not 'Monthly' or 'Yearly'.
- **Solution**: Specify either 'Monthly' or 'Yearly' as the accumulation type.

### No Reads Found (E-5014)
- **Cause**: No meter reads exist for the specified criteria.
- **Solution**: Verify the device ID and date range, then try again.

### Multiple Reads Not Allowed (E-5015)
- **Cause**: Attempted to submit multiple reads simultaneously.
- **Solution**: Submit reads one at a time.

### Organization Mismatch (E-5016)
- **Cause**: The device does not belong to the user's organization.
- **Solution**: Verify the device ID and organization permissions.

## Best Practices
- Always validate meter read data before submission
- Include proper error handling in your integration
- Monitor for and resolve data inconsistencies promptly
- Keep your integration updated with the latest API changes
- Verify device status and dates before submitting reads
- Use consistent timestamp formats (ISO 8601)
- Check for duplicate reads before submission
- Ensure proper device permissions before accessing or modifying reads

## Related Documentation

- [Device Registration](./device-errors.md)
- [Authentication](./authentication.md)
- [User Management](./user-management-errors.md)
- [Permission Errors](./permission-errors.md)
