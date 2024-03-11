<h1 align="center">
  <br>
  <a href="https://www.energyweb.org/"><img src="https://www.energyweb.org/wp-content/uploads/2019/04/logo-brand.png" alt="EnergyWeb" width="150"></a>
  <br>
  EnergyWeb Origin - DREC 
  <br>
  
  [API Documentation](http://drec-documentation.s3-website-us-east-1.amazonaws.com/entities/AggregateMeterRead.html) | [User guide](https://d-rec.atlassian.net/wiki/spaces/DREC/pages/84377601)
  
  <br>
</h1>


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

## Metamask Setup:

1. The metamask extension required to add in default browser before generating certificate. Create login 
2. When selecting netweok option choose the add manual network, use below values to create network manually 
  a. Network Name - It's depend on user (ex., Volta, Voltatest)
  b. New RPC URL - https://volta-rpc.energyweb.org
  c. ChainID - 73799
  d. Symbol - VT
  e. Block Explorer URL - https://volta-rpc.energyweb.org
3. Update your blockchain address and mnemonic as the variables `DREC_BLOCKCHAIN_ADDRESS` and `MNEMONIC` in our .env file
4. Add balance to your wallet using this link https://voltafaucet.energyweb.org/ by providing your blockchain address of your metamask
5. To get the issuer private key, go to Account details, click on the show private key button, there you will find the your Issuer private key. Add this key in your environment file as `ISSUER_PRIVATE_KEY`


Before running the script, make sure:

1. You have updated the DREC_BACKEND_URL in .env with local - also update the username and password for each integrator
2. Post generated devices to Server - Bulk Devices
3. You updated DREC_USERNAME & DREC_PASSWORD with the Owner credentials based on the integrator (Okra, BBOX, Engie etc.)
4. The methods in index.js should run independently. After each step, comment the completed step, uncomment the next step and restart the server
5. You can also use the docker desktop installed in local system which will be used to up the docker containers manually
6. After completed the local setup, before running the script, add environment variables `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FNAME`, `ADMIN_LNAME`, `ADMIN_ORG_NAME`,`ADMIN_ORG_ADDRESS`  with the user details you wanted to create as default admin user