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

## Local environment setup of Ubuntu

Install `wsl`,`ubuntu-18.04` in command prompt running as administrator:

```
wsl --install
wsl --install --distribution Ubuntu-18.04
```

Install `Influx-Client`: 

```
sudo apt install influx client
sudo apt update
```
Restart the Ubuntu terminal once, after installation done.

Clone and Install `nvm`:
```
sudo wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
nvm install 14.19.1
```

Install `rush`, `pnpm`, `yarn` if you don't have it:

```
npm i -g yarn
npm i -g @microsoft/rush
npm i -g pnpm
```

Create and change directory:
```
mkdir drec
cd drec
```

Clone repository:

It should be cloned in both local and Ubuntu environment.

```
git clone https://github.com/drec/drec-origin.git
chmod -R 777 drec-origin/
```

Copy `.env.example` to `.env` and adjust `.env` with your environment specific parameters.
```
cp .env.example .env
```

Start Postgres instance

```
docker pull postgres
docker run --name origin-postgres -e POSTGRES_PASSWORD=postgres -d -p 5432:5432 postgres
```

Create Postgres DB table

```
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE origin"
```

Create and start a Redis instance

```
docker pull redis
docker run --name origin-redis -d -p 6379:6379 redis
```



Create InfluxDB to store smart meter readings

These below commands should be run in the directory of cloned drec-project in local environment.
Replace PWD by your local cloned directory path.
ex., `docker run -rm --env-file ./.env -v C:/drec/drec-origin/influxdb-local:/var/lib/influxdb influxdb:1.8 /init-influxdb.sh`

```
docker run --rm --env-file ./.env -v $PWD/influxdb-local:/var/lib/influxdb influxdb:1.8 /init-influxdb.sh
```

Run the InfluxDB instance

```
docker run --name energy-influxdb --env-file ./.env -d -p 8086:8086 -v $PWD/influxdb-local:/var/lib/influxdb -v $PWD/influxdb.conf:/etc/influxdb/influxdb.conf:ro influxdb:1.8
```

Install dependencies, Run db migrations:

```
rush install
rush update
rush build
```

Run UI and API projects

```
rush start:dev
```

You may also want to drop local databases with

```
rush drop
```

## How to use

Go inside integrators-scripts folder
Create a .env, copy everything from .env.example and change the necessary variables depending on the environment

```
npm i
npm run start
```

Before running the script, make sure:

1. You have updated the DREC_BACKEND_URL in .env with local - also update the username and password for each integrator
2. Post generated devices to Server - Bulk Devices
3. You updated DREC_USERNAME & DREC_PASSWORD with the Owner credentials based on the integrator (Okra, BBOX, Engie etc.)
4. The methods in index.js should run independently. After each step, comment the completed step, uncomment the next step and restart the server
