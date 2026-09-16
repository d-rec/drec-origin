---
order: 5
---

# Advanced API Usage

## Submitting meter readings

Readings are submitted per device. The device is addressed by its identifier in the path.

```http
POST /api/meter-reads/new/:id
Authorization: Bearer <token>
Content-Type: application/json
```

Two reading **types** exist and are issued by different pipelines:

| Type      | Meaning                                                | Issued by                           |
| --------- | ------------------------------------------------------ | ----------------------------------- |
| `History` | A reading for a past period, submitted after the fact  | The historical-issuance job         |
| `Delta`   | An incremental reading for the current, ongoing period | The late-ongoing engine (see below) |

`POST /api/meter-reads/:id` is the legacy form of the same call and is kept for existing integrations. Administrators can submit on behalf of a device with `POST /api/meter-reads/addByAdmin/new/:externalId`.

Every reading is validated against the device's plausible maximum output for the period (capacity × hours, adjusted for device age and yield). Implausible readings are rejected with `409` and not stored — see [Troubleshooting](troubleshooting.md#meter-readings-rejected-with-409-conflict).

### Readings from CSV

A CSV of readings for one device can be ingested directly:

```http
POST /api/meter-reads/csv-ingest/:externalId
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

## Bulk device upload (CSV)

Register many devices at once from a CSV file:

1. `POST /api/bulk-upload` (multipart, `.csv` only) — creates a bulk-upload job and returns its `bulkUploadId`.
2. `POST /api/bulk-upload/:bulkUploadId/confirm` — confirms and processes the job.
3. `GET /api/bulk-upload` lists jobs; `GET /api/bulk-upload/bulk-upload-log/:bulkUploadId` returns the per-row outcome.

## How issuance works (late-ongoing engine)

`Delta` readings are certified in **daily issuance cycles** per device group. The engine only issues for windows that have a cycle, so two operations matter:

- **Create missing cycles** for a group — builds the daily cycles that do not yet exist:

  ```http
  POST /api/drec-issuer/missinglateongoing/onetimerun?groupId=<groupId>
  ```

- **Process issuance** for a group — mints certificates for every open cycle that has readings:

  ```http
  GET /api/drec-issuer/lateongoing?groupId=<groupId>
  ```

Processing also runs automatically on a schedule (see the [cron job list](../additional-resources/cron-jobs.md)). A cycle is matched to readings by the reading's `endDate` falling inside the cycle window; a cycle with no readings stays open until readings arrive.

## Exporting data

- **Per-device certificate log as CSV** — `GET /api/certificate-log/expoert_perdevice/:groupUid` streams a CSV download (the path segment is spelled exactly as shown).
- **Redemption report** — `GET /api/certificate-log/redemption-report`.
- Every resource is also available as JSON through its `GET` endpoints (devices, groups, readings, certificate logs); see the [Endpoints Reference](endpoints-reference.md).

## Device capacity

`capacity` on a device is in **kW**. It is used by the reading validation above, so keep it current when a site is upgraded — otherwise readings from the larger installation are rejected as implausible.
