---
order: 4
---

# Authentication & Authorization

The API uses **bearer tokens** (JWT). Every protected endpoint expects:

```http
Authorization: Bearer <token>
```

There are two kinds of credentials, issued by two different endpoints.

## Platform users (portal accounts)

Log in with the account's email and password to receive a session token:

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "user@example.org", "password": "..." }
```

Response:

```json
{ "accessToken": "<jwt>" }
```

- The token's lifetime is set by `JWT_EXPIRY_TIME` (default `7 days`).
- Each login creates a **server-side session**. Logging out removes it, after which the token is rejected with `401 Token revoked. Please log in again.` — even if it has not expired.
- Only the session token's **hash** is stored server-side; the raw token is never persisted.

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

Accounts must be **approved** before they can log in. A new registration that has not been reviewed by an administrator receives `403 Your account is pending approval…`; a suspended account receives `403 Your account has been suspended…`.

## API users (machine integrations)

Integrators that push meter readings or read certificate data programmatically use an **API user** account. Exchange its credentials for a long-lived access token:

```http
POST /api/auth/getAccess
Content-Type: application/json

{ "email": "api-user@example.org", "password": "..." }
```

Response:

```json
{ "accessToken": "<jwt>" }
```

Use it exactly like a session token (`Authorization: Bearer …`) on the meter-reading and certificate endpoints. API-user tokens are signed with a separate secret from portal sessions, so rotating one does not invalidate the other. An administrator can also export an API user's access-key file with `GET /api/user/export-accesskey/:api_user_id`.

## Roles and permissions

Access is role-based. Each endpoint declares the roles allowed to call it (for example, device registration requires `OrganizationAdmin` or `ApiUser`); calling an endpoint without a permitted role returns `403`. The exact roles per endpoint are listed in the interactive API reference — see the [Endpoints Reference](endpoints-reference.md) or the live Swagger UI at `/swagger` on any running instance.

## Operational notes

- The signing secrets (`JWT_SECRET` for sessions, `JWT_REGISTRANT_SECRET` for API-user tokens) are **required** in any non-development environment. The API refuses to start if either is missing or set to a placeholder value — see the README's environment table.
- **Rotating a secret invalidates every token signed with it**: users must log in again, and integrators must call `getAccess` again. Plan rotations accordingly.
