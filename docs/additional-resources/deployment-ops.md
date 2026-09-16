---
order: 4
---

# Deployment & Operations

This page describes how the platform is deployed and operated. It complements the local-development setup in the repository README.

## Environments

| Environment | Purpose                   | Portal                           | API                           |
| ----------- | ------------------------- | -------------------------------- | ----------------------------- |
| `stage`     | Pre-production validation | <https://stage-portal.drecs.org> | <https://stage-api.drecs.org> |
| `prod`      | Production                | <https://portal.drecs.org>       | <https://api.drecs.org>       |

Both run on AWS: the API on **EKS (Kubernetes)**, the database on **RDS PostgreSQL 15**, with Redis and InfluxDB alongside. Each environment has its own Kubernetes namespace and its own secret holding the environment variables (the same variables as `.env.example`).

## What deploys where

Deployments are driven by **branches**, not by merges to `develop`:

| Branch    | Effect                                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------------------------- |
| `develop` | Integration branch. Merging here **does not deploy anywhere** and does not run the CI checks (those run on pull requests). |
| `stage`   | A push triggers `build-deploy-docker-stage.yaml` → builds the image and deploys to **stage**                               |
| `prod`    | A push triggers `build-deploy-docker-prod.yaml` → builds the image and deploys to **prod**                                 |

Both deploy workflows can also be started manually from the Actions tab (`workflow_dispatch`).

The usual promotion path is `develop → stage → prod`: fast-forward the `stage` branch to the commit you want to test, verify it there, then fast-forward `prod`.

**Rollback:** push the previous known-good commit to the environment branch; the workflow redeploys that image.

The documentation site (this site) is published to GitHub Pages by `deploy-gh-pages.yaml`, which is **manual** (`workflow_dispatch`) — merging documentation changes does not publish them until the workflow is run.

## Required configuration

All configuration is supplied as environment variables (see `.env.example` for the full list). Two are enforced at startup:

- `JWT_SECRET` — signs portal session tokens.
- `JWT_REGISTRANT_SECRET` — signs API-user access tokens.

In any environment other than `development`/`test`, the API **refuses to start** if either is empty or set to a known placeholder value. Generate strong values (`openssl rand -hex 32`) and never reuse them across environments. Rotating either secret invalidates every token it signed — users log in again, integrators fetch new tokens.

## Health endpoints and probes

| Endpoint                 | Purpose                                     | Behaviour when the database is down |
| ------------------------ | ------------------------------------------- | ----------------------------------- |
| `GET /api/health`        | Liveness — is the process up?               | Still returns `ok`                  |
| `GET /api/health/status` | Readiness of dependencies (database, Redis) | Returns **`503`**                   |

When verifying a deployment or diagnosing an incident, use **`/api/health/status`**. A pod that is `Running` with `/api/health` returning `ok` can still be unable to reach its database; the `/status` endpoint is what proves connectivity. Rolling the deployment (a fresh pod must establish its initial database connection) is the definitive test.

## Database notes

- The API connects to PostgreSQL **without TLS**. If the RDS instance enforces SSL (`rds.force_ssl = 1`, which is the default for the `postgres15` parameter-group family), the API cannot connect until either TLS is configured in the client or `rds.force_ssl` is set to `0` in a custom parameter group. Keep this in mind on major-version upgrades, which change the parameter-group family.
- After a PostgreSQL **major-version upgrade**, run `ANALYZE` (e.g. `vacuumdb --analyze-in-stages`) as the database owner — the upgrade discards planner statistics, and without them query plans are poor. The application's database role is not the table owner, so this must be run with the master credentials.
- Take a manual snapshot before any upgrade or parameter change; RDS can only roll back a major upgrade by restoring a snapshot.

## Secrets hygiene

- Never commit real secrets; `.env` is git-ignored and `.env.example` ships without values for the signing secrets.
- Rotate the JWT secrets if they are ever exposed, and coordinate with integrators (their tokens will be invalidated).
