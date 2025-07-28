---
order: 5
---

# Tokenization and Transactions (E-4XXX)

This section documents error codes related to token generation, validation, and transaction processing in the D-REC platform.

## Token Generation (E-4001 - E-4099)

| Code | Title | Description | HTTP Status |
|------|-------|-------------|--------------|
| E-4001 | Token Generation Failed | Failed to generate a new token. Please try again. | 500 Internal Server Error |
| E-4002 | Invalid Token Format | The provided token format is invalid. | 400 Bad Request |
| E-4003 | Token Expired | The token has expired. Please request a new one. | 401 Unauthorized |
| E-4004 | Token Already Used | This token has already been used and cannot be reused. | 409 Conflict |
| E-4005 | Token Validation Failed | The token could not be validated. | 401 Unauthorized |
| E-4006 | Token Scope Mismatch | The token does not have the required scope for this operation. | 403 Forbidden |
| E-4007 | Token Rate Limit Exceeded | Too many token generation requests. Please wait before trying again. | 429 Too Many Requests |
| E-4008 | Token Issuance Restricted | Token issuance is currently restricted for this account. | 403 Forbidden |

## Transaction Processing (E-4100 - E-4199)

| Code | Title | Description | HTTP Status |
|------|-------|-------------|--------------|
| E-4100 | Transaction Failed | The transaction could not be completed. Please try again. | 500 Internal Server Error |
| E-4101 | Insufficient Balance | Your account has insufficient balance to complete this transaction. | 402 Payment Required |
| E-4102 | Invalid Transaction Amount | The specified transaction amount is invalid. | 400 Bad Request |
| E-4103 | Transaction Limit Exceeded | The transaction amount exceeds your allowed limit. | 403 Forbidden |
| E-4104 | Duplicate Transaction | A transaction with these details already exists. | 409 Conflict |
| E-4105 | Transaction Expired | The transaction has expired. Please initiate a new one. | 410 Gone |
| E-4106 | Transaction Validation Failed | The transaction failed validation checks. | 400 Bad Request |
| E-4107 | Transaction Rollback Failed | Failed to rollback the transaction. Please contact support. | 500 Internal Server Error |

## Token Redemption (E-4200 - E-4299)

| Code | Title | Description | HTTP Status |
|------|-------|-------------|--------------|
| E-4200 | Token Redemption Failed | Failed to redeem the token. Please try again. | 500 Internal Server Error |
| E-4201 | Invalid Token | The provided token is invalid or has been revoked. | 400 Bad Request |
| E-4202 | Token Already Redeemed | This token has already been redeemed. | 409 Conflict |
| E-4203 | Redemption Period Expired | The redemption period for this token has expired. | 410 Gone |
| E-4204 | Redemption Limit Reached | You have reached the maximum number of redemptions. | 403 Forbidden |
| E-4205 | Redemption Location Restricted | This token cannot be redeemed at your current location. | 403 Forbidden |
| E-4206 | Redemption Time Restricted | This token cannot be redeemed at the current time. | 403 Forbidden |

## Smart Contract (E-4300 - E-4399)

| Code | Title | Description | HTTP Status |
|------|-------|-------------|--------------|
| E-4300 | Smart Contract Error | An error occurred while executing the smart contract. | 500 Internal Server Error |
| E-4301 | Contract Not Found | The specified smart contract could not be found. | 404 Not Found |
| E-4302 | Contract Execution Failed | Failed to execute the smart contract. | 500 Internal Server Error |
| E-4303 | Invalid Contract Parameters | The provided contract parameters are invalid. | 400 Bad Request |
| E-4304 | Contract Deployment Failed | Failed to deploy the smart contract. | 500 Internal Server Error |
| E-4305 | Contract Call Not Allowed | You are not authorized to call this contract method. | 403 Forbidden |
| E-4306 | Contract State Invalid | The contract is not in a valid state for this operation. | 400 Bad Request |

## Related Documentation

- [System and Authentication Errors (E-1XXX)](/error-codes/system-auth-errors)
- [User Management (E-2XXX)](/error-codes/user-management-errors)
- [Device and Meter Read Management (E-3XXX)](/error-codes/device-meter-errors)
- [API and Integration (E-5XXX)](/error-codes/api-errors)
- [System Maintenance (E-9XXX)](/error-codes/maintenance-errors)
