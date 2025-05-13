---
order: 1
---

# Overview

The D-REC API provides developers with programmatic access to D-REC functionality. This guide will help you understand how to use the API effectively, authenticate your requests, and work with the available endpoints.

## Base URL

All API requests should be made to the following base URL:

```plaintext
https://dev-api.drecs.org/swagger/
```

## Authentication

The DRECS API uses bearer tokens for authentication. To access the API, you must include your token in the Authorization header of each request:

```plaintext
Authorization: Bearer your_token_here
```

## Request Format

The API accepts requests with the following content types:

- `application/json` for JSON payloads
- `multipart/form-data` for file uploads and form submissions

## Response Format

All responses are returned in JSON format. Each response includes:

- HTTP status code indicating success or failure
- Response body containing the requested data or error details

## Standard Response Structure

```json
{
  // Present when success is true
 { ... },
  // Present when success is false
  {
    "code": "ERROR_CODE",
    "message": "Error description",
    "error": " Error message",
  },
}
```

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of requests:

- 2xx: Success
- 4xx: Client errors (invalid input, authentication failures)
- 5xx: Server errors

Common error codes include:

- `400 Bad Request`: The request could not be understood or was missing required parameters
- `401 Unauthorized`: Authentication failed
- `403 Forbidden`: The API key doesn't have permission for the requested operation
- `404 Not Found`: The requested resource was not found
- `500 Internal Server Error`: An unexpected error occurred on the server

## Data Types

The API uses the following data types:

- String: Text values
- Number: Numerical values
- Boolean: true/false values
- Array: Ordered list of items
- Object: Collection of key-value pairs
- Date: ISO 8601 formatted dates (YYYY-MM-DDTHH:MM:SSZ)

Find the api endpoint documentation via this url [Endpoints Reference](endpoints-reference.md)
