---
order: 2
---

# Authentication Error Codes (E-1XXX)

This section documents error codes related to system-level issues and authentication problems.

## Authentication Error Codes

| Code   | Title                       | Description                                                                                   |
| ------ | --------------------------- | --------------------------------------------------------------------------------------------- |
| E-1001 | Invalid Credentials         | The provided username or password is incorrect. Please verify your credentials and try again. |
| E-1002 | Session Expired             | Your session has expired. Please log in again to continue.                                    |
| E-1003 | Accept Terms and Conditions | You must accept the terms and conditions to continue.                                         |
| E-1004 | Verify your email           | Please verify your email address to continue.                                                 |
| E-1005 | Verify phone number         | Please verify your phone number to continue.                                                  |
| E-1006 | Verify your organization    | Please verify your organization to continue.                                                  |

## Common Scenarios

### Invalid Credentials (E-1001)

- **Cause**: The username or password entered is incorrect, or the account does not exist.
- **Solution**: Double-check your credentials and try again. If you've forgotten your password, use the password reset feature.

### Session Expired (E-1002)

- **Cause**: Your authentication token has expired due to inactivity or security reasons.
- **Solution**: Log in again to obtain a new authentication token.

### Verification Required (E-1004, E-1005, E-1006)

- **Cause**: Your account requires additional verification steps (email, phone, or organization).
- **Solution**: Complete the verification process through the link sent to your email or contact support for assistance.

## Best Practices

### Secure Password Management

- Use strong, unique passwords
- Consider using a password manager
- Never share your credentials

### Session Security

- Always log out from shared devices
- Enable multi-factor authentication if available
- Be cautious of phishing attempts

### Account Verification

- Keep your contact information up to date
- Complete all required verifications promptly
- Contact support if you encounter verification issues

### Error Handling

- Implement proper error handling in your application
- Provide clear, user-friendly error messages
- Log security-related errors for monitoring

## Related Documentation

- [User Management Errors (E-2XXX)](./user-management-errors.md)
- [Device Registration Errors (E-4XXX)](./device-errors.md)
- [Meter Reads Errors (E-5XXX)](./meter-reads-errors.md)
- [Permission Errors (E-6XXX)](./permission-errors.md)
