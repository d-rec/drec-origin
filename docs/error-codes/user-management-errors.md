---
order: 3
---

# User Management Errors (E-2XXX)

This section documents error codes related to user registration, authentication, and account management.

## User Registration

| Code   | Title                   | Description                                                                              |
| ------ | ----------------------- | ---------------------------------------------------------------------------------------- |
| E-2001 | User Exists             | An account or user with this email address already exists. Please use a different email. |
| E-2002 | Organization Exists     | An organization with this name already exists. Please use a different name.              |
| E-2003 | Phone Number Registered | A user with this phone number already exists. Please use a different phone number.       |
| E-2004 | Registration Timeout    | The registration process has timed out. Please start again.                              |

## User Verification

| Code   | Title                        | Description                                                                                                 |
| ------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| E-2100 | Invalid Email Token          | The email confirmation token is invalid or has expired. Please verify your email address before proceeding. |
| E-2101 | User email already confirmed | The user email is already confirmed.                                                                        |
| E-2102 | Invalid Phone Token          | The phone confirmation token is invalid or has expired. Please verify your phone number before proceeding.  |
| E-2103 | User phone already confirmed | The user phone is already confirmed.                                                                        |
| E-2104 | Failed to send OTP           | Failed to send OTP to the phone number. Please try again.                                                   |

## User Retrieval

| Code   | Title              | Description                                        |
| ------ | ------------------ | -------------------------------------------------- |
| E-2200 | User Not Found     | The user with the specified ID does not exist.     |
| E-2201 | Api User Not Found | The api user with the specified ID does not exist. |

## User Update

| Code   | Title              | Description                                        |
| ------ | ------------------ | -------------------------------------------------- |
| E-2300 | User Not Found     | The user with the specified ID does not exist.     |
| E-2301 | Api User Not Found | The api user with the specified ID does not exist. |

## User Password Reset

| Code   | Title                      | Description                                    |
| ------ | -------------------------- | ---------------------------------------------- |
| E-2500 | User Not Found             | The user with the specified ID does not exist. |
| E-2501 | Incorrect Current Password | The current password is incorrect.             |

## Related Documentation

- [Authentication](./authentication.md)
- [Device Registration](./device-errors.md)
- [Meter Reads](./meter-reads-errors.md)
- [Permissions](./permission-errors.md)

## Error Response Example

```json
{
  "statusCode": 400,
  "message": "User with this email already exists",
  "error": "E-2001",
  "timestamp": "2023-07-29T12:00:00.000Z",
  "path": "/api/users/register"
}
```
