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

## Local environment setup

### Windows only: Install WSL and Ubuntu

Install `wsl` and `ubuntu-20.04` in command prompt running as administrator:

```sh
wsl --install
wsl --install --distribution Ubuntu-20.04
```

> **Note:** The following steps should be run inside the WSL Ubuntu terminal on Windows, or directly in your terminal on macOS/Linux.

### Install Influx Client

**Linux / WSL (Ubuntu/Debian):**

```sh
sudo apt update
sudo apt install influxdb-client
```

**macOS:**

```sh
brew install influxdb-cli
```

Restart the terminal once after installation is done.

Install `nvm` following the [official installation instructions](https://github.com/nvm-sh/nvm#installing-and-updating), then install the required Node.js version:

```sh
nvm install 20.14.0
```

Install `pnpm` if you don't have it:

```sh
npm i -g pnpm
```

Clone repository:

```sh
git clone https://github.com/d-rec/drec-origin.git
cd drec-origin
```

Copy `.env.example` to `.env` and adjust `.env` with your environment specific parameters.

```sh
cp .env.example .env
```

Start Postgres, Redis, InfluxDB instance

Please create and start your Postgres, Redis and InfluxDB by running below command in the root directory, after that anytime you can manage these images through your docker desktop installed on your system.

```sh
docker-compose up --build
```

Create Postgres DB table

```sh
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE origin"
```

Create Default Admin:

Please update below environment variables under default admin credential with the values that you wanted to create as default admin user.

```sh
ADMIN_EMAIL
ADMIN_PASSWORD
```

Navigate to the API project and install dependencies:

```sh
cd apps/drec-api
pnpm install
pnpm build
```

Run API project in development mode:

```sh
pnpm start:dev
```

For the initial setup, run this command to seed the database with the basic permissions and content:

```sh
pnpm seed:permissions
```

To approve unverified users, run this command. This can be run anytime after a new user has been added to verify them:

```sh
pnpm seed:verifications
```

To populate the database with organizations and devices dummy data, run this command:

```sh
pnpm seed:dummy-data
```

## How to use

Go inside integrators-scripts folder
Create a .env, copy everything from .env.example and change the necessary variables depending on the environment

```sh
npm i
npm run start
```

## Metamask Setup

1. The metamask extension required to add in default browser before generating certificate. Create login
2. When selecting netweok option choose the add manual network, use below values to create network manually
   a. Network Name - It's depend on user (ex., Volta, Voltatest)
   b. New RPC URL - <https://volta-rpc.energyweb.org>
   c. ChainID - 73799
   d. Symbol - VT
   e. Block Explorer URL - <https://volta-rpc.energyweb.org>
3. Update your blockchain address and mnemonic as the variables `DREC_BLOCKCHAIN_ADDRESS` and `MNEMONIC` in our .env file
4. Add balance to your wallet using this link <https://voltafaucet.energyweb.org/> by providing your blockchain address of your metamask
5. To get the issuer private key, go to Account details, click on the show private key button, there you will find the your Issuer private key. Add this key in your environment file as `ISSUER_PRIVATE_KEY`

Before running the script, make sure:

1. You have updated the DREC_BACKEND_URL in .env with local - also update the username and password for each integrator
2. Post generated devices to Server - Bulk Devices
3. You updated DREC_USERNAME & DREC_PASSWORD with the Owner credentials based on the integrator (Okra, BBOX, Engie etc.)
4. The methods in index.js should run independently. After each step, comment the completed step, uncomment the next step and restart the server
5. You can also use the docker desktop installed in local system which will be used to up the docker containers manually

## Testing email locally (Mailpit)

In local dev, emails are captured by **Mailpit** — a local SMTP server that accepts everything without authentication and shows a web inbox. Nothing is actually delivered.

The `docker-compose.yml` runs it as `drec-mailpit` and the local `.env` already points at it:

```
SMTP_HOST=localhost
SMTP_PORT=1025
```

**To start Mailpit:**

```sh
docker compose up -d drec-mailpit
```

**To view captured emails:**

Open **http://localhost:8025** in your browser.

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
2. Open **http://localhost:9001** in your browser.
3. Log in with:
   - **Username:** `minioadmin`
   - **Password:** `minioadmin`
4. Navigate to **Buckets → drec-documents** to browse uploaded files.

**Useful `mc` (MinIO client) commands** (run inside the `drec-minio-init` container or with `mc` installed locally):

```sh
# List all objects in the bucket
mc ls local/drec-documents --recursive

# Download a specific file
mc cp local/drec-documents/<key> ./output-file

# Set an alias pointing at the local server
mc alias set local http://localhost:9000 minioadmin minioadmin
```

## Dependencies

This project uses a variety of dependencies developed for D-REC. For a detailed list of these dependencies—including their GitHub links and version information—please refer to the [Dependencies](./DEPENDENCIES.md) page.
