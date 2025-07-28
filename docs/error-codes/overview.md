---
order: 1
---

# Overview

This document provides a comprehensive list of error codes used in the D-REC platform. Each error code follows a consistent format and is categorized by the system component it relates to.

## Error Code Format

D-REC error codes follow this format: `E-XXXX` where:

- `E-1XXX`: System and Authentication Errors
- `E-2XXX`: User Management and Permissions
- `E-3XXX`: Device and Meter Read Management
- `E-4XXX`: Tokenization and Transactions
- `E-5XXX`: API and Integration Errors
- `E-9XXX`: System Maintenance and Unknown Errors

## Error Code Structure

Each error includes:
- **Code**: The unique error identifier (e.g., E-3001)
- **Title**: A brief, clear title for the error
- **Description**: Detailed explanation of the error and possible solutions
- **HTTP Status**: The associated HTTP status code (when applicable)

## Error Categories

1. [System and Authentication Errors (E-1XXX)](/error-codes/system-auth-errors)
2. [User Management (E-2XXX)](/error-codes/user-management-errors)
3. [Device and Meter Read Management (E-3XXX)](/error-codes/device-meter-errors)
4. [Tokenization and Transactions (E-4XXX)](/error-codes/tokenization-errors)
5. [API and Integration (E-5XXX)](/error-codes/api-errors)
6. [System Maintenance (E-9XXX)](/error-codes/maintenance-errors)

## How to Use This Documentation

1. When you encounter an error, note the error code (e.g., E-3001).
2. Navigate to the appropriate category based on the first digit.
3. Look up the specific error code for detailed information and resolution steps.

## Contributing

To suggest new error codes or updates to existing ones, please submit a pull request with the proposed changes to the appropriate error code file.