---
order: 3
---

# Data Models & Schemas

## Certificate Log (per-device)

Each entry in the `perDeviceCertificateLog` array returned by the certificate endpoints contains:

| Field | Type | Description |
|---|---|---|
| `id` | number | Certificate log record ID |
| `certificate_issuance_startdate` | ISO 8601 | Start of the certified period |
| `certificate_issuance_enddate` | ISO 8601 | End of the certified period |
| `readvalue_watthour` | number | Energy produced in Wh for this period |
| `status` | string | Issuance status |
| `externalId` | string | Internal device identifier (UUID) |
| `developerId` | string | Developer's external reference for the device (e.g. Powertrust Site ID) |
| `serialNumber` | string | Device serial number |
| `deviceId` | number | Internal device ID |
| `groupId` | number | Device group ID |
| `certificateTransactionUID` | string | Certificate transaction identifier |
| `timezone` | string | Device timezone |
| `ongoing_start_date` | ISO 8601 | Ongoing cycle start |
| `ongoing_end_date` | ISO 8601 | Ongoing cycle end |

> **Note:** `developerId` is the identifier originally supplied by the device developer during registration (e.g. the Powertrust Site ID). Use this field to correlate certificates with devices in external systems.
