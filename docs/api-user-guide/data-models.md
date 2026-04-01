---
order: 3
---

# Data Models & Schemas

## Device Registration (POST /api/device)

The device registration endpoint accepts **both** `application/json` and `multipart/form-data`.

### Option 1: Plain JSON (no documents)

Send device data directly as a JSON body:

```http
POST /api/device
Content-Type: application/json
Authorization: Bearer <token>

{
  "externalId": "DEV-001",
  "projectName": "My Solar Project",
  "countryCode": "IN",
  "commissioningDate": "2025-01-15",
  "capacity": 50,
  "address": "123 Solar Lane",
  "latitude": "12.9716",
  "longitude": "77.5946",
  "fuelCode": "ES100",
  "deviceTypeCode": "TC110",
  "organizationId": 1,
  "serialNumber": "SN-001"
}
```

### Option 2: Multipart form-data (with documents)

Send device data as a JSON string in the `deviceToRegister` field, with optional file uploads:

```http
POST /api/device
Content-Type: multipart/form-data
Authorization: Bearer <token>

deviceToRegister: '{"externalId":"DEV-001","projectName":"My Solar Project",...}'
FORM_SF_02: <file>         (optional)
SF_02C: <file>             (optional)
METERING_EVIDENCE: <file>  (optional)
SINGLE_LINE_DIAGRAM: <file>(optional)
PROJECT_PHOTOS: <file>     (optional)
COD_PROOF: <file>          (optional)
```

Each file field accepts up to 10 files.

### Required Roles

The caller must have one of: `OrganizationAdmin`, `ApiUser`.

### Document Types

| Field Name            | Description                           |
| --------------------- | ------------------------------------- |
| `FORM_SF_02`          | SF-02 application form                |
| `SF_02C`              | SF-02C compliance form                |
| `METERING_EVIDENCE`   | Metering/measurement evidence         |
| `SINGLE_LINE_DIAGRAM` | Single line diagram (SLD)             |
| `PROJECT_PHOTOS`      | Site/project photographs              |
| `COD_PROOF`           | Certificate of completion / COD proof |

## Device Update (PATCH /api/device/:externalId)

The device update endpoint also accepts both `application/json` and `multipart/form-data`, following the same dual-path pattern. When using multipart, send the device data as a JSON string in the `deviceToUpdate` field.

All document file uploads are optional on update.

---

## Certificate Log (per-device)

Each entry in the `perDeviceCertificateLog` array returned by the certificate endpoints contains:

| Field                            | Type     | Description                                                             |
| -------------------------------- | -------- | ----------------------------------------------------------------------- |
| `id`                             | number   | Certificate log record ID                                               |
| `certificate_issuance_startdate` | ISO 8601 | Start of the certified period                                           |
| `certificate_issuance_enddate`   | ISO 8601 | End of the certified period                                             |
| `readvalue_watthour`             | number   | Energy produced in Wh for this period                                   |
| `status`                         | string   | Issuance status                                                         |
| `externalId`                     | string   | Internal device identifier (UUID)                                       |
| `developerId`                    | string   | Developer's external reference for the device (e.g. Powertrust Site ID) |
| `serialNumber`                   | string   | Device serial number                                                    |
| `deviceId`                       | number   | Internal device ID                                                      |
| `groupId`                        | number   | Device group ID                                                         |
| `certificateTransactionUID`      | string   | Certificate transaction identifier                                      |
| `timezone`                       | string   | Device timezone                                                         |
| `ongoing_start_date`             | ISO 8601 | Ongoing cycle start                                                     |
| `ongoing_end_date`               | ISO 8601 | Ongoing cycle end                                                       |

> **Note:** `developerId` is the identifier originally supplied by the device developer during registration (e.g. the Powertrust Site ID). Use this field to correlate certificates with devices in external systems.
