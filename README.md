<p align="center">
  <a href="https://github.com/d-rec/drec-origin">
    <img
      src="https://drecs.org/wp-content/uploads/2022/10/D-RECs_logo_RGB-3-Beatrice-Kennedy.jpg"
      alt="D-REC"
      width="640"
    >
  </a>
</p>
<p align="center">
    <em>The D-REC Initative has designed and created its own open-source automated monitoring, reporting and verification (MRV) platform. The platform will allow distributed renewable energy (DRE) assets to automativally submit meter generation data via an API, which will then be aggregated together and issued as a verified and tradeable D-REC.</em>
</p>
<p align="center">
  <img
    alt="Project Status"
    src="https://img.shields.io/badge/Project%20Status-stable-green"
  >
  <img
    alt="GitHub Workflow Status"
    src="https://img.shields.io/github/actions/workflow/status/d-rec/drec-origin/build.yaml"
  >
  <a href="https://github.com/d-rec/drec-origin/blob/main/LICENSE" target="_blank">
    <img
      alt="License"
      src="https://img.shields.io/github/license/d-rec/drec-origin"
    >
  </a>
</p>

---

Repository for Origin DREC project

## Environments

| Environment | Purpose | Infrastructure |
|---|---|---|
| `development` | Local development and testing | localhost / Docker |
| `stage` | Pre-production validation | AWS EKS + RDS |
| `demo` | Stakeholder demos | AWS EKS + RDS |
| `prod` | Production | AWS EKS + RDS |

> **Note:** The `develop` branch is intended for local development only. It runs against a local PostgreSQL database seeded with `rush start:dev`. There is no cloud infrastructure for the develop environment — do not deploy it to AWS.

## Prerequisites

| Tool | Version | How to install |
|------|---------|----------------|
| **Node.js** | 20.x (tested with 20.14.0) | [nvm](https://github.com/nvm-sh/nvm#installing-and-updating): `nvm install 20.14.0` |
| **pnpm** | 10.x | `npm i -g pnpm` |
| **Docker Desktop** | Latest | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) |
| **Git** | Latest | Pre-installed on macOS; `apt install git` on Linux |

> **Windows users:** Install [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) with Ubuntu first (`wsl --install --distribution Ubuntu-20.04`) and run all commands inside the WSL terminal.

## Local environment setup

### 1. Clone and configure

```sh
git clone https://github.com/d-rec/drec-origin.git
cd drec-origin
cp .env.example .env
```

Edit `.env` and fill in the required values. The most important ones:

| Variable | What to put | Notes |
|----------|-------------|-------|
| `ISSUER_PRIVATE_KEY` | An Ethereum private key (hex, **without** `0x` prefix) | For local dev you can generate a throwaway key — see [Blockchain / Wallet setup](#blockchain--wallet-setup) below |
| `DREC_BLOCKCHAIN_ADDRESS` | Your Metamask wallet address | Same section below |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credentials for the default admin user | Any valid email/password for local dev |

All other values in `.env.example` have sensible defaults for local development.

### 2. Start Docker services

Make sure **Docker Desktop is running** first, then:

```sh
docker compose up -d
```

This starts PostgreSQL, Redis, MinIO (S3-compatible storage), and Mailpit (email catcher).

> The `origin` database is created automatically by the Docker Compose Postgres container — you do **not** need to run `CREATE DATABASE` manually.

The local Postgres instance is seeded with a default admin account:

| Field | Value |
|-------|-------|
| **Email** | `admin@drec.local` |
| **Password** | `Admin1234!` |

### 3. Install dependencies and run

```sh
cd apps/drec-api
pnpm install
pnpm start:dev
```

`pnpm start:dev` automatically runs database migrations before starting the API in watch mode.

### 4. Seed the database

```sh
# Basic permissions and content (required on first setup)
pnpm seed:permissions

# Approve any unverified users (can be re-run anytime)
pnpm seed:verifications

# Optional: populate with dummy organizations and devices
pnpm seed:dummy-data
```

## How to use

Go inside integrators-scripts folder
Create a .env, copy everything from .env.example and change the necessary variables depending on the environment

```sh
npm i
npm run start
```

## Blockchain / Wallet setup

The seed migration and certificate issuance require an Ethereum private key. There are two ways to get one:

### Option A: Generate a throwaway key (quickest for local dev)

```sh
node -e "const w = require('ethers').Wallet.createRandom(); console.log('ISSUER_PRIVATE_KEY=' + w.privateKey.slice(2)); console.log('DREC_BLOCKCHAIN_ADDRESS=' + w.address)"
```

Paste the output values into your `.env`. This is fine for local development — do **not** use a wallet that holds real funds.

### Option B: Use Metamask (needed for certificate generation)

1. Install the [Metamask](https://metamask.io/) browser extension and create a wallet.
2. Add the **Volta** test network manually:

   | Field | Value |
   |-------|-------|
   | Network Name | Volta |
   | RPC URL | `https://volta-rpc.energyweb.org` |
   | Chain ID | 73799 |
   | Symbol | VT |
   | Block Explorer | `https://volta-explorer.energyweb.org` |

3. Fund your wallet with test tokens at <https://voltafaucet.energyweb.org/>.
4. Export your private key: **Account details → Show private key**.
5. Update `.env`:
   ```ini
   ISSUER_PRIVATE_KEY=<private-key-without-0x-prefix>
   DREC_BLOCKCHAIN_ADDRESS=<your-wallet-address>
   ```

## Integrator scripts

Go inside the `integrators-scripts/` folder:

```sh
cd integrators-scripts
cp .env.example .env
# Edit .env — set DREC_BACKEND_URL, DREC_USERNAME, DREC_PASSWORD, etc.
npm install
npm run start
```

> The methods in `index.js` should be run independently. After each step, comment the completed step, uncomment the next, and restart.

## Testing email locally (Mailpit)

In local dev, emails are captured by **Mailpit** — a local SMTP server that accepts everything without authentication and shows a web inbox. Nothing is actually delivered.

The `docker-compose.yml` runs it as `drec-mailpit` and the local `.env` already points at it:

```ini
SMTP_HOST=localhost
SMTP_PORT=1025
```

**To start Mailpit:**

```sh
docker compose up -d drec-mailpit
```

**To view captured emails:**

Open <http://localhost:8025> in your browser.

**For production**, replace the `.env` SMTP values with real credentials (e.g. `smtp.gmail.com` + a Gmail App Password or SMTP relay).

## Browsing MinIO (local dev)

MinIO is the S3-compatible object store used for device submission documents. In local dev it runs as a Docker container and exposes two ports:

| Port | Purpose |
|------|---------|
| 9000 | S3 API (used by the backend) |
| 9001 | Web console (browser UI) |

**To open the browser console:**

1. Make sure the Docker services are running:

   ```sh
   docker compose up -d drec-minio
   ```

2. Open <http://localhost:9001> in your browser.
3. Log in with:
   - **Username:** `minioadmin`
   - **Password:** `minioadmin`
4. Navigate to **Buckets → drec-documents** to browse uploaded files.

## Logging (Grafana Loki)

The API uses [Winston](https://github.com/winstonjs/winston) with a [Grafana Loki](https://grafana.com/oss/loki/) transport for centralized, long-term logging. The same setup works locally (Docker) and on AWS — just change `.env` variables.

### Local setup

Loki and Grafana are included in `docker compose up -d` (no extra step needed). Add to your `.env`:

```ini
LOKI_ENABLED=true
LOKI_URL=http://localhost:3100
```

Restart the API, then open <http://localhost:3001> (Grafana, login: admin/admin).
Go to **Explore → Loki** and query `{app="drec-api"}`.

### AWS setup

Point `LOKI_URL` at your Loki instance and optionally set basic auth:

```ini
LOKI_ENABLED=true
LOKI_URL=https://loki.your-domain.com
LOKI_AUTH_USER=<user>
LOKI_AUTH_PASS=<password>
```

### Optional: file logging

```ini
LOG_FILE_ENABLED=true
LOG_DIR=logs
```

Daily-rotated files: `drec-YYYY-MM-DD.log` (all levels) and `drec-error-YYYY-MM-DD.log` (errors only, kept 90 days).

### All logging env vars

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Min level: `error`, `warn`, `info`, `verbose`, `debug` |
| `LOG_FILE_ENABLED` | `false` | Enable daily rotate log files |
| `LOG_DIR` | `logs` | Directory for log files |
| `LOKI_ENABLED` | `false` | Push logs to Grafana Loki |
| `LOKI_URL` | `http://localhost:3100` | Loki push endpoint |
| `LOKI_AUTH_USER` | | Basic-auth user (optional) |
| `LOKI_AUTH_PASS` | | Basic-auth password (optional) |
| `LOKI_LABELS` | `{}` | Extra labels as JSON |

## Solar panel detection (Roboflow)

The device-reviews satellite map includes a "Detect Panels" button that uses [Roboflow](https://roboflow.com/) zero-shot segmentation to identify solar panels in the satellite imagery.

The API key is kept server-side. Add these env vars:

```ini
ROBOFLOW_WORKFLOW_URL=https://serverless.roboflow.com/peters-workspace-dsmnf/workflows/general-segmentation-api
ROBOFLOW_API_KEY=<your Roboflow publishable API key>
```

The frontend calls `POST /device-reviews/detect-panels` which proxies the request to Roboflow.

## Databases

```ini
# Production
DB_HOST=drec.ck6auzh6fp4v.eu-west-1.rds.amazonaws.com

# Staging
DB_HOST=drec-staging.ck6auzh6fp4v.eu-west-1.rds.amazonaws.com
```

## Troubleshooting

### `docker ps` → "failed to connect to the docker API"

Docker Desktop is not running. Open it from your Applications folder (macOS) or Start menu (Windows) and wait for it to finish starting.

### Migration error: `invalid hexlify value … value=""`

The `ISSUER_PRIVATE_KEY` environment variable is missing or empty. The seed migration creates an Ethereum Wallet with this key. See [Blockchain / Wallet setup](#blockchain--wallet-setup) for how to set it.

### `util_1.isString is not a function` / `util_1.isObject is not a function`

Version mismatch between NestJS packages. Some `@nestjs/*` packages (e.g. `@nestjs/config@1.0.x`, `@nestjs/bull@0.4.x`) import internal utilities that were removed in `@nestjs/common@8.x`. Upgrade the offending package:

```sh
cd apps/drec-api
pnpm add @nestjs/config@^2.3.0   # fixes isObject
pnpm add @nestjs/bull@^10.0.0    # fixes isString
pnpm add @nestjs/schedule@^2.2.0 # if same error appears here
```

### pnpm: "Unexpected store location"

This happens when pnpm was upgraded to a new major version. The fix:

```sh
# If dist/js/node_modules exists and causes the error, remove it first:
rm -rf apps/drec-api/dist/js/node_modules
pnpm install
```

### npm: "Your cache folder contains root-owned files" (EACCES)

A previous `sudo npm install` left root-owned files in the npm cache. Fix with:

```sh
sudo chown -R $(whoami):staff ~/.npm
```

### npm: "Unknown project config shamefully-hoist"

Harmless warning — `shamefully-hoist` is a pnpm-specific setting in `.npmrc`. It does not affect npm and can be ignored.

## Dependencies

This project uses a variety of dependencies developed for D-REC. For a detailed list of these dependencies—including their GitHub links and version information—please refer to the [Dependencies](./DEPENDENCIES.md) page.
