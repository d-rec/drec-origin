# Enode integration

Pulls live solar-inverter telemetry from the [Enode API](https://developers.enode.com/api/reference)
and ingests it as D-REC meter reads through the existing `ReadsService` pipeline,
so the production-ceiling check and downstream issuance apply unchanged.

## How it works

1. `EnodeAuthService` obtains and caches an OAuth2 `client_credentials` bearer
   token (~1h TTL, refreshed 60s early).
2. `EnodeClient` calls `GET /inverters/{id}` (the live snapshot — **not**
   `/statistics`, which is throttled and returns null on fresh reads).
3. `EnodeSyncService` diffs `productionState.totalLifetimeProduction` (a
   cumulative kWh counter) between polls. Each positive delta becomes one
   `Delta` meter read (`unit: kWh`) stored via `ReadsService.storeRead`.
4. `EnodeCron` runs the sync on a `@NonConcurrentCron` schedule (hourly default).

## Configuration (all via env)

The integration is **inert unless both client credentials are set** — it cannot
affect existing flows when unconfigured.

| Env var               | Required | Default                                       | Notes                           |
| --------------------- | -------- | --------------------------------------------- | ------------------------------- |
| `ENODE_CLIENT_ID`     | yes      | —                                             | enables the integration         |
| `ENODE_CLIENT_SECRET` | yes      | —                                             | enables the integration         |
| `ENODE_OAUTH_URL`     | no       | `https://oauth.sandbox.enode.io/oauth2/token` | use the production URL for live |
| `ENODE_API_URL`       | no       | `https://enode-api.sandbox.enode.io`          | use the production URL for live |
| `ENODE_API_VERSION`   | no       | `2024-10-01`                                  | pins the response schema        |
| `ENODE_POLL_CRON`     | no       | hourly                                        | standard cron expression        |
| `ENODE_DEVICE_MAP`    | no       | `[]`                                          | JSON array, see below           |

`ENODE_DEVICE_MAP` maps an Enode inverter to the D-REC device it feeds:

```json
[
  {
    "inverterId": "449c5d52-9ba7-44bb-9322-d5703ec5816e",
    "deviceExternalId": "AC0061"
  }
]
```

## Known limitations of this first cut

- **Baseline is in-memory.** The last lifetime counter per inverter resets on
  restart; the first tick after a restart re-seeds and emits no read (it can't
  recover energy produced while the process was down).
- **Mapping is env-driven**, not per-organisation, and there is no UI to manage it.
- **No device linking flow.** A site owner's inverter must already be linked to
  an Enode user out of band, and the resulting inverter id pasted into
  `ENODE_DEVICE_MAP`.

## Productionisation path

Mirror the Evident integration (`pods/evident`):

1. Add an `EnodeSettings` entity (per-organisation: encrypted credentials,
   Enode user id, poll frequency, `lastCounterKwh`, `lastPolledAt`) — this also
   makes the baseline durable, removing the restart caveat above.
2. Add a nullable `Device.enodeInverterId` column and resolve mappings from the
   DB instead of `ENODE_DEVICE_MAP`.
3. Add an admin controller + UI to run the Enode **Link UI** flow and store the
   returned inverter id against the device.

Both (1) and (2) require migrations, deliberately deferred out of this first cut.
