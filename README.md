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

Start Postgres, Redis, InfluxDB instance

Please create and start your Postgres, Redis and InfluxDB by running below command in our root directory, after that anytime you can manage this images through your docker desktop installed on your system.

```
docker-compose up --build
```

Create Postgres DB table

```
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE origin"
```

Install dependencies, Run db migrations:

```
rush install
rush update
rush build
```

Run API project

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