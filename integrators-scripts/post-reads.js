'use strict';

require('dotenv').config();
const axios = require('axios');
const server = process.env.DREC_BACKEND_URL;
const csv = require('csv-parser');
const fs = require('fs');

const auth = require('./auth');

const postMeterReads = async (externalId, meterReads, token) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };
  try {
    const res = await axios.post(
      `${server}/meter-reads/${externalId}`,
      meterReads,
      config,
    );
    console.log('Meter reads uploaded: ', res.data);
  } catch (err) {
    console.error('Error while uploading meter reads: ', err.response.data);
  }
};

const readMeterDataAndStore = (apiToken, csvFilePath) => {
  const results = [];
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      const productsIds = Array.from(new Set(results.map((read) => read.id)));
      Promise.all(
        productsIds.map(async (id) => {
          const reads = [];
          results.map((readResult) => {
            if (readResult.id === id && readResult.value) {
              reads.push({
                timestamp: readResult.timestamp,
                value: Number(readResult.value),
              });
            }
          });
          const meterReads = {
            reads,
            unit: 'Wh',
          };
          console.log('Saving reads...', id, meterReads);
          // Save it to D-REC DB
          await postMeterReads(id, meterReads, apiToken);
        }),
      );
    });
};

const postOkraReads = async () => {
  const apiToken = await auth.loginOkra();
  readMeterDataAndStore(apiToken, './integrator-csv/okra.csv');
};

const postOkraReadsDAILY = async () => {
  const apiToken = await auth.loginOkra();
  readMeterDataAndStore(apiToken, './integrator-daily-csv/okra.csv');
};

const postNSRReads = async () => {
  const apiToken = await auth.loginNSR();
  readMeterDataAndStore(apiToken, './integrator-csv/nsr.csv');
};

const postNSRReadsDAILY = async () => {
  const apiToken = await auth.loginNSR();
  readMeterDataAndStore(apiToken, './integrator-daily-csv/nsr.csv');
};

const postEngieReads = async () => {
  const apiToken = await auth.loginEngie();
  readMeterDataAndStore(apiToken, './integrator-csv/engie.csv');
};

const postDistributedEnergyReads = async () => {
  const apiToken = await auth.loginDistributedEnergy();
  readMeterDataAndStore(apiToken, './integrator-csv/distributed-energy.csv');
};

const postCandiReads = async () => {
  const apiToken = await auth.loginCandi();
  readMeterDataAndStore(apiToken, './integrator-csv/candi.csv');
};

const postCandiReadsDAILY = async () => {
  const apiToken = await auth.loginCandi();
  readMeterDataAndStore(apiToken, './integrator-daily-csv/candi.csv');
};

module.exports = {
  postOkraReads,
  postOkraReadsDAILY,
  postNSRReads,
  postNSRReadsDAILY,
  postEngieReads,
  postDistributedEnergyReads,
  postCandiReads,
  postCandiReadsDAILY,
};
