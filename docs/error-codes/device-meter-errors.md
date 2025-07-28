---
order: 3
---

# Device and Meter Read Management (E-3XXX)

This section documents error codes related to device registration, meter read submissions, and management.

## Device Registration (E-3001 - E-3099)

| Code | Title | Description | HTTP Status |
|------|-------|-------------|--------------|
| E-3001 | Device Already Registered | A device with this identifier is already registered in the system. | 409 Conflict |
| E-3002 | Invalid Device Identifier | The provided device identifier is not in the correct format. | 400 Bad Request |
| E-3003 | Device Not Found | The specified device could not be found. Please verify the device ID and try again. | 404 Not Found |
| E-3004 | Device Registration Limit Reached | You have reached the maximum number of devices allowed for your account. | 403 Forbidden |
| E-3005 | Device Inactive | The specified device is currently inactive. Please contact support to reactivate. | 403 Forbidden |
| E-3006 | Invalid Device Type | The specified device type is not supported. | 400 Bad Request |
| E-3007 | Device Location Required | Device location information is required for registration. | 400 Bad Request |
| E-3008 | Device Verification Failed | Could not verify the device details. Please check and try again. | 400 Bad Request |

## Meter Read Submissions (E-3100 - E-3199)

| Code | Title | Description | HTTP Status |
|------|-------|-------------|--------------|
| E-3100 | Invalid Meter Read Value | The provided meter read value is invalid. Please check the value and try again. | 400 Bad Request |
| E-3101 | Meter Read Too High | The submitted meter read exceeds the maximum expected generation for this period. | 400 Bad Request |
| E-3102 | Meter Read Too Low | The submitted meter read is lower than the previous reading. | 400 Bad Request |
| E-3103 | Duplicate Meter Read | A meter read with these details already exists. | 409 Conflict |
| E-3104 | Meter Read Frequency Exceeded | Meter reads cannot be submitted more than once per [time period]. | 429 Too Many Requests |
| E-3105 | Invalid Meter Read Timestamp | The timestamp for the meter read is invalid or in the future. | 400 Bad Request |
| E-3106 | Meter Read Validation Failed | The meter read data failed validation checks. | 400 Bad Request |
| E-3107 | Meter Read Out of Sequence | The submitted meter read is not in sequence with previous reads. | 400 Bad Request |
| E-3108 | Missing Required Meter Read Data | One or more required meter read fields are missing. | 400 Bad Request |

## Device Management (E-3200 - E-3299)

| Code | Title | Description | HTTP Status |
|------|-------|-------------|--------------|
| E-3200 | Device Update Failed | Failed to update the device information. Please try again. | 500 Internal Server Error |
| E-3201 | Device Deletion Restricted | This device cannot be deleted as it has associated meter reads. | 403 Forbidden |
| E-3202 | Device Status Update Failed | Failed to update the device status. Please try again. | 500 Internal Server Error |
| E-3203 | Device Ownership Required | You do not have permission to modify this device. | 403 Forbidden |
| E-3204 | Device Maintenance Mode | The device is currently in maintenance mode. Please try again later. | 503 Service Unavailable |
| E-3205 | Device Communication Error | Unable to communicate with the device. Please check the connection and try again. | 502 Bad Gateway |

## Meter Read Management (E-3300 - E-3399)

| Code | Title | Description | HTTP Status |
|------|-------|-------------|--------------|
| E-3300 | Meter Read Not Found | The specified meter read could not be found. | 404 Not Found |
| E-3301 | Meter Read Update Failed | Failed to update the meter read. Please try again. | 500 Internal Server Error |
| E-3302 | Meter Read Deletion Restricted | This meter read cannot be deleted as it has been processed. | 403 Forbidden |
| E-3303 | Meter Read Processing | The meter read is currently being processed. Please try again later. | 202 Accepted |
| E-3304 | Meter Read Rejected | The meter read was rejected. Please verify the data and resubmit. | 400 Bad Request |
| E-3305 | Meter Read Verification Required | This meter read requires manual verification before processing. | 202 Accepted |

## Related Documentation

- [System and Authentication Errors (E-1XXX)](/error-codes/system-auth-errors)
- [User Management (E-2XXX)](/error-codes/user-management-errors)
- [Tokenization and Transactions (E-4XXX)](/error-codes/tokenization-errors)
- [API and Integration (E-5XXX)](/error-codes/api-errors)
- [System Maintenance (E-9XXX)](/error-codes/maintenance-errors)
