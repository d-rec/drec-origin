# PowerTrust frozen integration sandbox

On 2026-04-14 we stood up a dedicated, **frozen** environment for PowerTrust
at `https://powertrust-api.drecs.org`. This document explains why it exists,
what it contains, how it was built, and how to tear it down when the time
comes. The goal is that any future dev can maintain, rebuild, or delete the
environment without re-deriving everything from scratch.

## Why it exists

PowerTrust is an API-only registrant. They integrate directly from their own
AWS deployments — they have no local dev environment, so any breaking change
we ship lands on them as an outage. On 2026-04-14 they asked us to roll back
API changes that had been shipped to `stage`. Rather than stalling main-line
development to accommodate a single registrant's inability to iterate, we
cloned a frozen copy of the environment pinned to the last commit before the
changes they were struggling with. They now integrate against the frozen env
on their own timeline; our main-line keeps moving.

**Policy:** this environment is never evolved. When PowerTrust catches up to
the current API, we tear it down. It is not a second staging.

## What it is

- **API only.** No UI. PowerTrust's integration is pure HTTP. The `drec-ui`
  package is not present in the repo at the pinned commit anyway.
- **Pinned to `drec-origin` commit `b80bf934`** (2026-03-07, Yannick Musafiri,
  "chore: cleanup documentation" — the last commit before `peterlaufenberg`
  commits begin).
- **Fully isolated from stage/prod.** Dedicated RDS, dedicated namespace, its
  own Redis, its own Ethereum dev chain. No shared state with any other env.
- **Synthetic data only.** No production registrant data was cloned. An empty
  DB was populated by running the frozen commit's migrations against it.

## Where the pieces live

### Infrastructure

| Resource | Identifier | Notes |
| --- | --- | --- |
| Public URL | `https://powertrust-api.drecs.org` | A-alias in Route53 zone `Z02636383I2YYKVLMYATA` pointing at the shared `drec-ingress` ALB |
| TLS cert | `arn:...:certificate/24b01bc3-74cb-4719-9bb5-78f416d92fa0` | Existing wildcard `*.drecs.org`, reused |
| EKS cluster | `drec` in `eu-west-1` | Same cluster as stage/dev/prod/demo |
| K8s namespace | `powertrust` | New |
| RDS | `drec-powertrust` | db.t3.micro, pg14.17, 20 GB gp2, in `default-vpc-0140cd2d437c5ef38` |
| RDS security group | `sg-015b2b3491dd25553` | Allows 5432 only from EKS cluster SG `sg-0164d1d9472c663e4` |
| Container image | `drec-api:powertrust-b80bf934` | In ECR repo `drec-api`. **Do not retag or overwrite.** |

### K8s manifests in [`drec-infrastructure`](https://github.com/d-rec/drec-infrastructure)

Committed in commit `8b29803` ("add frozen powertrust integration sandbox"):

- `deployments/drec-api/drec-api-powertrust.yaml` — the `drec-api` Deployment
  and its inline `redis` Deployment+Service. **Image tag is hardcoded** to
  `powertrust-b80bf934` rather than templated via `${{ inputs.environment }}`.
  Includes `enableServiceLinks: false` (see gotcha #3 below).
- `scaling/drec-api-powertrust.yaml` — HPA, pinned to 1/1.
- `ingress/powertrust.yaml` — ALB ingress for `powertrust-api.drecs.org`,
  shares the existing `drec-ingress` ALB group.

**No CI workflow touches these files.** They are deliberately outside the
normal per-env build/deploy pipeline (which would re-render the image tag on
every push to `stage`, defeating the "frozen" principle).

### K8s resources that are NOT in git

Two deployments live in the cluster but are not currently in the
`drec-infrastructure` repo:

1. **`ganache`** — an in-cluster Ethereum dev chain. Applied once from a
   local manifest. See gotcha #2 for why it's required. If it ever gets
   evicted and rescheduled it will come back from the existing ReplicaSet;
   if someone nukes the namespace, re-apply from
   [the manifest reproduced in the appendix below](#appendix-ganache-manifest).
2. **`drec-api-migrate-initial`** Job — one-shot migration runner. Can be
   deleted after it completes.

### Secret `drec-powertrust-env`

Applied directly via `kubectl apply` from a locally-generated YAML (not in
git — secrets never go in git). Values include:

- Fresh random `JWT_SECRET`, `JWT_API_USER_SECRET`,
  `CLIENT_CREDENTIALS_ENCRYPTION_KEY`, `DEBUG_API_KEY`
- `DB_*` for `drec-powertrust` RDS
- `REDIS_URL=redis` (host only, see gotcha #3)
- `WEB3=http://ganache:8545`, `ISSUER_PRIVATE_KEY=<ganache deterministic
  account 0>` — valid on the local chain, unfunded anywhere real
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — admin seed credentials
- Placeholder values for SMTP, AWS S3, InfluxDB — **no real production
  credentials are in this env**

## How it was built (reproducible outline)

1. Created security group `sg-015b2b3491dd25553` in `vpc-0140cd2d437c5ef38`,
   allowing tcp/5432 from EKS cluster SG.
2. Created empty RDS `drec-powertrust` (pg14.17, db.t3.micro, same subnet
   group as `drec-staging`). Master user `postgres`, random 32-char password.
3. Checked out `b80bf934` in a detached worktree. **Edited the Dockerfile to
   remove the `RUN pnpm run sentry:sourcemaps` line** (gotcha #1), then built
   and pushed the image as `drec-api:powertrust-b80bf934`.
4. Created namespace `powertrust`.
5. Applied `ganache` Deployment+Service (gotcha #2).
6. Created K8s Secret `drec-powertrust-env` with random keys + RDS creds +
   ganache's deterministic account 0 private key + `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
7. Ran a one-shot migration Job invoking TypeORM CLI directly against the
   compiled ORM configs (gotcha #4). The Seed migration deployed contracts on
   the in-cluster ganache, inserted roles/permissions/admin user.
8. Applied the three manifests from `drec-infrastructure` (`deployments`,
   `scaling`, `ingress`). Waited for rollout.
9. Created Route53 A-alias record. Verified
   `curl https://powertrust-api.drecs.org/api/health` returns `ok` and that
   admin login returns a JWT.

## Gotchas (read before touching anything)

### 1. The Dockerfile build step for Sentry sourcemaps must be skipped

The Dockerfile at `b80bf934` has:

```dockerfile
RUN pnpm run sentry:sourcemaps
```

which invokes `sentry-cli sourcemaps upload` and hard-fails the build on any
non-real `SENTRY_AUTH_TOKEN`. We don't (and shouldn't) give the frozen-env
build a real token, so this line gets removed at build time. **Any rebuild of
the powertrust image needs the same skip.** It lives in the worktree only —
the repo file is untouched.

### 2. The Seed migration unconditionally deploys blockchain contracts

The frozen `9999999999999-Seed.ts` seed migration:

```ts
const issuerAccount = new Wallet(process.env.ISSUER_PRIVATE_KEY!);
// ...
public async up(queryRunner: QueryRunner): Promise<any> {
  const { registry } = await this.seedBlockchain(queryRunner);
  // ...
}
```

- Instantiates `new Wallet(...)` **at module import time**. A missing or
  empty `ISSUER_PRIVATE_KEY` will crash before any migration even starts. A
  syntactically valid 32-byte hex key is enough — it doesn't have to be
  funded on any real chain.
- `seedBlockchain()` is the first thing `up()` does, and it unconditionally
  calls `deployContracts(issuerAccount, provider)`. There is no env flag to
  skip, no check for already-deployed addresses.

We can't run migrations without *some* Ethereum JSON-RPC that will accept
contract deployment from the configured wallet. The solution for powertrust
was an in-cluster `trufflesuite/ganache` pod with `--wallet.deterministic`
and `--chain.chainId=246`, and setting `ISSUER_PRIVATE_KEY` to ganache's
deterministic account 0 (which starts funded with 1000 ETH on the local
chain). This satisfies the seed migration; PowerTrust never exercises the
blockchain path at runtime.

**The seed also requires `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars** that
are not in `.env.example`. Without them, it fails at the `seedAdmin` step
with `"Please set your environment variables ADMIN_EMAIL and ADMIN_PASSWORD"`.

### 3. `enableServiceLinks: false` is required on the `drec-api` Deployment

`drec-api`'s Redis config does:

```ts
new Redis({
  host: process.env.REDIS_URL ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
});
```

Kubernetes **automatically injects** environment variables for every Service
in the same namespace. When a Service is named `redis`, the pod gets:

```
REDIS_PORT=tcp://10.100.150.81:6379
REDIS_SERVICE_PORT=6379
REDIS_SERVICE_HOST=10.100.150.81
```

`Number("tcp://10.100.150.81:6379")` is `NaN`, and `ioredis` throws
`ERR_SOCKET_BAD_PORT`. The fix is `enableServiceLinks: false` in the pod
spec, which disables the auto-injection entirely.

Stage is immune only because its Redis is external (ElastiCache) and nothing
in the stage namespace is named `redis`. **If someone ever creates a Service
named `redis` in the `stage` namespace, stage will break the same way.**

### 4. The `migrate:docker` / `typeorm:run` scripts are broken post-prune

`package.json` at `b80bf934` defines:

```
typeorm => ts-node -r tsconfig-paths/register node_modules/typeorm/cli.js --config ormconfig-dev.ts
```

which points at a **TypeScript** config file (`ormconfig-dev.ts`) and uses
ts-node. After `pnpm prune --prod`, `@types/node` is gone, and ts-node fails
with:

```
ormconfig-dev.ts(7,10): error TS2591: Cannot find name 'process'.
```

The working approach is to invoke the typeorm CLI directly against the
already-compiled JS configs:

```sh
# issuer chain
node node_modules/typeorm/cli.js \
  --config node_modules/@energyweb/issuer-api/dist/js/ormconfig.js \
  migration:run
# main chain
node node_modules/typeorm/cli.js \
  --config dist/js/ormconfig.js \
  migration:run
# certificate chain
node node_modules/typeorm/cli.js \
  --config node_modules/@energyweb/origin-247-certificate/dist/js/ormconfig.js \
  migration:run
```

This is what the powertrust migration Job's `command` does.

## How to access

- Public API: `https://powertrust-api.drecs.org/api/health`
- Admin login:

  ```sh
  curl -sS -X POST https://powertrust-api.drecs.org/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"username":"admin@powertrust.local","password":"<see secure channel>"}'
  ```

  The admin password was generated at standup and stored locally on Peter's
  machine. It is not committed anywhere. Ask Peter if you need it.
- DB: the RDS `drec-powertrust` instance is reachable only from inside the
  EKS cluster SG. Use `kubectl -n powertrust run psql --rm -it ...` with
  the DB credentials from the `drec-powertrust-env` secret.

## How to sunset

When PowerTrust has finished migrating to the current API:

1. `kubectl delete namespace powertrust` — removes drec-api, redis, ganache,
   HPA, ingress, secret.
2. Delete the Route53 A-alias `powertrust-api.drecs.org` in zone
   `Z02636383I2YYKVLMYATA`.
3. `aws rds delete-db-instance --db-instance-identifier drec-powertrust
   --skip-final-snapshot` — no prod data, skipping the final snapshot is
   safe.
4. `aws ec2 delete-security-group --group-id sg-015b2b3491dd25553`.
5. Optionally delete ECR tag `drec-api:powertrust-b80bf934`.
6. Revert `drec-infrastructure` commit `8b29803` — removes the three
   manifest files and the README section.
7. Delete this file from `drec-origin`.

## Appendix: ganache manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  namespace: powertrust
  name: ganache
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: ganache
  replicas: 1
  template:
    metadata:
      labels:
        app.kubernetes.io/name: ganache
    spec:
      containers:
        - name: ganache
          image: trufflesuite/ganache:latest
          args:
            - --wallet.deterministic=true
            - --wallet.totalAccounts=10
            - --chain.chainId=246
            - --chain.networkId=246
            - --server.host=0.0.0.0
            - --server.port=8545
            - --miner.blockGasLimit=100000000
          ports:
            - name: rpc
              containerPort: 8545
          resources:
            requests: { cpu: 20m, memory: 128Mi }
            limits:   { cpu: 500m, memory: 512Mi }
---
apiVersion: v1
kind: Service
metadata:
  namespace: powertrust
  name: ganache
spec:
  ports:
    - port: 8545
      targetPort: 8545
      protocol: TCP
  selector:
    app.kubernetes.io/name: ganache
```

Deterministic account 0 (pre-funded with 1000 ETH on the local chain):

- Address: `0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1`
- Private key: `0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d`

This key is used for `ISSUER_PRIVATE_KEY` in the powertrust env secret. It
has no value on any real chain — do not reuse it anywhere that isn't a
local dev chain.
