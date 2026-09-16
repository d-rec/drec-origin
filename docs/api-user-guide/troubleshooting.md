---
order: 6
---

# Troubleshooting & FAQ

## Authentication errors

| Response                                  | Cause                                                                                    | Fix                                                                                              |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `401 Unauthorized`                        | Missing, malformed or expired bearer token                                               | Log in again (`POST /api/auth/login`) or fetch a new API-user token (`POST /api/auth/getAccess`) |
| `401 Token revoked. Please log in again.` | The session was logged out, or the signing secret was rotated since the token was issued | Obtain a fresh token                                                                             |
| `403 Your account is pending approval…`   | The account has been registered but not yet approved by an administrator                 | Wait for the approval email, or ask an administrator to review the registration                  |
| `403 Your account has been suspended…`    | The account was suspended                                                                | Contact the platform administrator                                                               |
| `403 Forbidden` (no message)              | The account's role is not permitted on that endpoint                                     | Check the required roles in the API reference; use an account with the right role                |

See [Authentication & Authorization](authentication.md) for how tokens are issued.

## Meter readings rejected with `409 Conflict`

A reading is validated on ingestion against what the device could plausibly have generated: its **capacity** (kW), the length of the reading period, the device's age and its configured yield. A reading whose value exceeds that ceiling is rejected with `409` and is **not stored** — there is no retry queue.

Common causes:

- The device's `capacity` in the platform is out of date (for example after a physical upgrade). Update the device record (`PATCH /api/device/:externalId`) and **re-submit** the rejected readings.
- The reading's period (`startDate`/`endDate`) is wrong, making the value look implausible for the interval.
- Units: `capacity` is in **kW**; reading values are in the unit declared on the reading.

## Bulk uploads

- `POST /api/bulk-upload` accepts **`.csv` only**; other file types are rejected.
- A job is created first and then confirmed (`POST /api/bulk-upload/:bulkUploadId/confirm`). Per-row results are available from `GET /api/bulk-upload/bulk-upload-log/:bulkUploadId`.

## Certificates are not being issued

- Readings of type `History` are issued by the historical-issuance job; readings of type `Delta` are issued by the **late-ongoing** engine, which only processes reading windows for which an issuance cycle exists. See [Advanced API Usage](advanced.md) and the [cron job schedule](../additional-resources/cron-jobs.md).
- Readings below the issuance threshold for a period (very small values) will not produce a certificate.

## Checking platform health

- `GET /api/health` is the liveness endpoint. It reports `ok` as long as the process is up — it does **not** fail when the database is unreachable.
- `GET /api/health/status` checks the dependencies (database, Redis) and returns **`503`** if any is down. Use this one when diagnosing connectivity problems.

## Where to look next

- The interactive API reference (`/swagger` on any running instance) documents every endpoint, its parameters and its required roles.
- Application logs include the underlying database or validation error for each failed request.
