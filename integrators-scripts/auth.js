'use strict';

require('dotenv').config();
const axios = require('axios');
const server = process.env.DREC_BACKEND_URL;
const { Logger } = require('@nestjs/common');

const login = async (username, password) => {
    const logger = new Logger('login');
    const auth = {
        username: username,
        password: password
    };
    try {
        const resp = await axios.post(`${server}/auth/login`, auth);
        return resp.data.accessToken;
    } catch (err) {
        logger.error('Error: ', err);
    }
};

const loginOkra = async () => {
    const username = process.env.OKRA_USERNAME;
    const password = process.env.OKRA_PASSWORD;
    const apiToken = await login(username, password);
    return apiToken;
};

const loginNSR = async () => {
    const username = process.env.NSR_USERNAME;
    const password = process.env.NSR_PASSWORD;
    const apiToken = await login(username, password);
    return apiToken;
};

const loginEngie = async () => {
    const username = process.env.ENGIE_USERNAME;
    const password = process.env.ENGIE_PASSWORD;
    const apiToken = await login(username, password);
    return apiToken;
};

const loginDistributedEnergy = async () => {
    const username = process.env.DE_USERNAME;
    const password = process.env.DE_PASSWORD;
    const apiToken = await login(username, password);
    return apiToken;
};

const loginCandi = async () => {
    const username = process.env.CANDI_USERNAME;
    const password = process.env.CANDI_PASSWORD;
    const apiToken = await login(username, password);
    return apiToken;
};

const loginBBOX = async () => {
    const username = process.env.BBOX_USERNAME;
    const password = process.env.BBOX_PASSWORD;
    const apiToken = await login(username, password);
    return apiToken;
};

module.exports = {
    loginOkra,
    loginNSR,
    loginEngie,
    loginDistributedEnergy,
    loginCandi,
    loginBBOX
};
