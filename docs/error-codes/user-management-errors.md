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

## Common Scenarios

### User Already Exists (E-2001)

- **Cause**: The email address is already registered in the system.
- **Solution**: Use a different email address or use the password reset option if you've forgotten your credentials.

### Organization Already Exists (E-2002)

- **Cause**: An organization with the same name is already registered.
- **Solution**: Choose a different organization name or contact support if you believe this is an error.

### Invalid Verification Token (E-2100, E-2102)

- **Cause**: The verification link or code has expired or is invalid.
- **Solution**: Request a new verification email or code and try again.

### User Not Found (E-2200, E-2201, E-2300, E-2301, E-2500)

- **Cause**: The requested user account could not be found.
- **Solution**: Verify the user ID and try again. Ensure you have the correct permissions.

### Incorrect Current Password (E-2501)

- **Cause**: The current password provided does not match our records.
- **Solution**: Double-check your current password and try again. Use the password reset if needed.

## Best Practices

### User Registration Best Practices

- **Email Verification**: Always verify new email addresses before allowing account access
- **Password Strength**: Enforce strong password policies
- **Input Validation**: Validate all user input on both client and server sides

### Account Management

- **Session Management**: Implement proper session timeouts and token expiration
- **Rate Limiting**: Protect against brute force attacks with rate limiting
- **Audit Logs**: Maintain logs of all user management activities

### Security Measures

- **Multi-factor Authentication**: Encourage or require MFA for sensitive operations
- **Password Reset**: Implement secure password reset flows with time-limited tokens
- **Account Lockout**: Temporarily lock accounts after multiple failed login attempts

### Error Handling

- **Clear Messages**: Provide clear, actionable error messages
- **Logging**: Log all security-related errors for monitoring
- **User Guidance**: Include guidance on how to resolve common issues

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
