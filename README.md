<h1 align="center">
  <br>
  <a href="https://www.energyweb.org/"><img src="https://www.energyweb.org/wp-content/uploads/2019/04/logo-brand.png" alt="EnergyWeb" width="150"></a>
  <br>
  EnergyWeb Origin - DREC 
  <br>
  <br>
</h1>

Repository for Origin DREC project

## How to use

Install `rush`, `pnpm` if you don't have it:

```
npm i -g @microsoft/rush
npm i -g pnpm
```

```
rush install
rush build
```

Copy `.env.example` to `.env` and adjust `.env` with your environment specific parameters.

Start Postgres instance

```
docker pull postgres
docker run --name origin-postgres -e POSTGRES_PASSWORD=postgres -d -p 5432:5432 postgres
```

Create Postgres DB table

```
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE origin"
```

Create InfluxDB to store smart meter readings

```
docker run --rm --env-file ./.env -v $PWD/influxdb-local:/var/lib/influxdb influxdb:1.8 /init-influxdb.sh
```

Run the InfluxDB instance

```
docker run --name energy-influxdb --env-file ./.env -d -p 8086:8086 -v $PWD/influxdb-local:/var/lib/influxdb -v $PWD/influxdb.conf:/etc/influxdb/influxdb.conf:ro influxdb:1.8
```

Create and start a Redis instance

```
docker pull redis
docker run --name origin-redis -d -p 6379:6379 redis
```

Run UI and API projects

```
rush start:dev
```

You may also want to drop local databases with

```
rush drop
```

## Heroku deployment script

This repo has a script for easy Heroku deployments for UI And API project. Script assumes that Heroku applications are already created and Postgres DB is provisioned.

```
HEROKU_API_KEY=<APIKEY> HEROKU_STABLE_APP_API=<APP_NAME> HEROKU_STABLE_APP_UI=<APP_NAME> rush deploy:heroku
```

When starting containers and running the app rush start:dev (it immediately starts API and UI servers, which are accessible at ports that have to be mapped:

| Application | Port  |
| ----------- | ----- |
| UI          | $PORT |
| API         | 3040  |

D-REC Integrators:

## How to use

Go inside integrators-scripts folder
Create a .env, copy everything from .env.example and change the necessary variables depending on the environment

```
npm i
npm run start
```

Before running the script, make sure:

1. You have updated the DREC_BACKEND_URL in .env with local or heroku - also update the username and password for each integrator
2. Post generated devices to Server - Bulk Devices
3. You updated DREC_USERNAME & DREC_PASSWORD with the Owner credentials based on the integrator (Okra, BBOX, Engie etc.)
4. The methods in index.js should run independently. After each step, comment the completed step, uncomment the next step and restart the server
