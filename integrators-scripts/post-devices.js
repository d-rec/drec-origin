'use strict';

require('dotenv').config();
const axios = require('axios');
const server = process.env.DREC_BACKEND_URL;

const auth = require('./auth');
const integrators = require('./integrators');

const okraDevices = require(`./integrator-devices/${integrators.Integrator.OKRA}-devices.json`);
const engieDevices = require(`./integrator-devices/${integrators.Integrator.ENGIE}-devices.json`);
const distributedEnergyDevices = require(`./integrator-devices/${integrators.Integrator.DISTRIBUTED_ENERGY}-devices.json`);
const nsrDevices = require(`./integrator-devices/${integrators.Integrator.NSR}-devices.json`);
const candiDevices = require(`./integrator-devices/${integrators.Integrator.CANDI}-devices.json`);
const bboxxDevices = require(`./integrator-devices/${integrators.Integrator.BBOX}-devices.json`);

const postDevices = async (devices, token) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    try {
        const res = await axios.post(`${server}/device-group/bulk-devices`, devices, config);
        console.log('Device Group uploaded with result: ', res.data);
    } catch (err) {
        console.error('Error: ', err.response.data);
    }
};

const postOkraDevices = async () => {
    const apiToken = await auth.loginOkra();
    return await postDevices(okraDevices, apiToken);
};

const postNSRDevices = async () => {
    const apiToken = await auth.loginNSR();
    return await postDevices(nsrDevices, apiToken);
};

const postEngieDevices = async () => {
    const apiToken = await auth.loginEngie();
    const limit = 200;
    const chunks = Math.round(engieDevices.length / 200);
    // The list is way too long, so we need to split them into batches (Max allowed is 200 devices per batch)
    for (let i = 0; i < chunks; i++) {
        let start = limit * i + (i == 0 ? i : 1);
        let end = limit * (i + 1);
        const devices = engieDevices.slice(start, end);
        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        await sleep(2000);
        await postDevices(devices, apiToken);
    }
    return;
};

const postBBOXDevices = async () => {
    const apiToken = await auth.loginBBOX();
    return await postDevices(bboxxDevices, apiToken);
};

const postDistributedEnergyDevices = async () => {
    const apiToken = await auth.loginDistributedEnergy();
    return await postDevices(distributedEnergyDevices, apiToken);
};

const postCandiDevices = async () => {
    const apiToken = await auth.loginCandi();
    return await postDevices(candiDevices, apiToken);
};

module.exports = {
    postOkraDevices,
    postNSRDevices,
    postEngieDevices,
    postDistributedEnergyDevices,
    postCandiDevices,
    postBBOXDevices
};
