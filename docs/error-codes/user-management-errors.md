---
order: 4
---

# User Management (E-2XXX)

This section documents error codes related to user registration, authentication, and account management.

## User Registration (E-2001 - E-2099)

| Code | Title | Description | HTTP Status |
|------|-------|-------------|--------------|
| E-2001 | Email Already Registered | An account with this email address already exists. Please use a different email or try to log in. | 409 Conflict |
| E-2002 | Invalid Email Format | The provided email address is not valid. Please check the format and try again. | 400 Bad Request |
| E-2003 | Weak Password | The provided password does not meet the security requirements. | 400 Bad Request |
| E-2004 | Registration Disabled | New user registration is currently disabled. Please contact support for assistance. | 403 Forbidden |
| E-2005 | Required Field Missing | One or more required registration fields are missing. | 400 Bad Request |
| E-2006 | Invalid Verification Code | The verification code is invalid or has expired. | 400 Bad Request |
| E-2007 | Verification Required | Please verify your email address before proceeding. | 403 Forbidden |
| E-2008 | Registration Timeout | The registration process has timed out. Please start again. | 408 Request Timeout |

## User Authentication (E-2100 - E-2199)

| Code | Title | Description | HTTP Status |
|------|-------|-------------|--------------|
| E-2100 | Account Not Found | No account found with the provided credentials. | 404 Not Found |
| E-2101 | Account Not Active | Your account is not active. Please check your email for activation instructions. | 403 Forbidden |
| E-2102 | Account Suspended | Your account has been suspended. Please contact support for assistance. | 403 Forbidden |
| E-2103 | Too Many Failed Attempts | Too many failed login attempts. Please try again in 15 minutes. | 429 Too Many Requests |
| E-2104 | Password Reset Required | You must reset your password before logging in. | 403 Forbidden |
| E-2105 | Password Expired | Your password has expired. Please reset your password. | 403 Forbidden |
| E-2106 | External Authentication Failed | Failed to authenticate with the external provider. Please try again. | 401 Unauthorized |

## User Profile (E-2200 - E-2299)

| Code | Title | Description | HTTP Status |
|------|-------|-------------|--------------|
| E-2200 | Profile Update Failed | Failed to update your profile. Please try again. | 500 Internal Server Error |
| E-2201 | Invalid Phone Number | The provided phone number is not valid. | 400 Bad Request |
| E-2202 | Email Change Verification Required | Please verify your new email address to complete the change. | 403 Forbidden |
| E-2203 | Profile Picture Upload Failed | Failed to upload the profile picture. Please try again. | 500 Internal Server Error |
| E-2204 | Invalid Date of Birth | The provided date of birth is not valid. | 400 Bad Request |
| E-2205 | Profile Incomplete | Your profile is incomplete. Please complete all required fields. | 400 Bad Request |

## User Permissions (E-2300 - E-2399)

| Code | Title | Description | HTTP Status |
|------|-------|-------------|--------------|
| E-2300 | Permission Denied | You don't have permission to perform this action. | 403 Forbidden |
| E-2301 | Role Assignment Failed | Failed to assign the specified role. | 500 Internal Server Error |
| E-2302 | Invalid Role | The specified role does not exist. | 400 Bad Request |
| E-2303 | Role Update Not Allowed | You don't have permission to modify this role. | 403 Forbidden |
| E-2304 | Self Role Modification Not Allowed | You cannot modify your own role. | 403 Forbidden |
| E-2305 | Role Limit Reached | The maximum number of users with this role has been reached. | 403 Forbidden |

## User Sessions (E-2400 - E-2499)

| Code | Title | Description | HTTP Status |
|------|-------|-------------|--------------|
| E-2400 | Session Limit Reached | You have reached the maximum number of active sessions. Please log out from another device. | 403 Forbidden |
| E-2401 | Session Not Found | The specified session could not be found. | 404 Not Found |
| E-2402 | Session Termination Failed | Failed to terminate the session. Please try again. | 500 Internal Server Error |
| E-2403 | Concurrent Session Not Allowed | Only one active session is allowed. Your previous session has been terminated. | 403 Forbidden |

## Related Documentation

- [System and Authentication Errors (E-1XXX)](/error-codes/system-auth-errors)
- [Device and Meter Read Management (E-3XXX)](/error-codes/device-meter-errors)
- [Tokenization and Transactions (E-4XXX)](/error-codes/tokenization-errors)
- [API and Integration (E-5XXX)](/error-codes/api-errors)
- [System Maintenance (E-9XXX)](/error-codes/maintenance-errors)
