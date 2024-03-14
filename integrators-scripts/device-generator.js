'use strict';

const { DateTime } = require('luxon');
const fs = require('fs');

const okraProducts = require('./integrator-products/Okra-products.json');
const engieProducts = require('./integrator-products/Engie-products.json');
const distributedEnergyProducts = require('./integrator-products/Distributed-Energy-products.json');
const nsrProducts = require('./integrator-products/NSR-products.json');
const candiProducts = require('./integrator-products/Candi-products.json');
const bboxProducts = require('./integrator-products/BBOX-products.json');

const integrators = require('./integrators');

const getIntegratorDefaultValues = (obj, integrator) => {
    switch (integrator) {
        case integrators.Integrator.OKRA:
            return {
                externalId: obj.externalId,
                projectName: obj.externalId,
                latitude: obj.latitude,
                longitude: obj.longitude,
                countryCode: obj.countryCode,
                capacity: obj.capacity,
                // Default values
                fuelCode: 'ES100',
                deviceTypeCode: 'TC120',
                installationConfiguration: 'StandAlone',
                commissioningDate: '2021-05-30',
                gridInterconnection: false,
                offTaker: 'Residential',
                sector: 'Residential',
                standardCompliance: 'I-REC',
                yieldValue: 1500,
                integrator: integrator,
                status: 'Active'
            };
        case integrators.Integrator.ENGIE:
            const formatDate = (date) => {
                const dateSplitted = date.split('/');
                return `${dateSplitted[2]}-${dateSplitted[1]}-${dateSplitted[0]}`;
            };
            return {
                externalId: obj.externalID,
                projectName: obj.projectName,
                latitude: obj.latitude,
                longitude: obj.longitude,
                countryCode: obj.countryCode,
                capacity: obj.capacity * 10 ** 3,
                address: obj.address,
                fuelCode: obj.fuelCode,
                deviceTypeCode: obj.deviceTypeCode,
                installationConfiguration: obj.installationconfiguration,
                gridInterconnection: obj.gridInterconnection,
                standardCompliance: obj.standardcompliance,
                commissioningDate: DateTime.fromJSDate(
                    new Date(formatDate(obj.commissioningdate))
                ).toFormat('yyyy-MM-dd'),
                // Default values
                offTaker: 'Residential',
                sector: 'Residential',
                yieldValue: 1500,
                integrator: integrator,
                status: 'Active'
            };
        case integrators.Integrator.DISTRIBUTED_ENERGY:
            return {
                externalId: obj.externalId,
                projectName: obj.projectName,
                latitude: Number(obj.latitude),
                longitude: Number(obj.longitude),
                countryCode: obj.countryCode,
                capacity: obj.capacity * 10 ** 3,
                address: obj.address,
                fuelCode: obj.fuelCode,
                deviceTypeCode: obj.deviceTypeCode,
                installationConfiguration: obj.installationconfiguration,
                gridInterconnection: obj.gridInterconnection,
                standardCompliance: obj.standardCompliance,
                offTaker: obj.offTaker,
                sector: obj.sector,
                yieldValue: obj.yieldValue,
                commissioningDate: DateTime.fromJSDate(new Date(obj.commissioningDate)).toFormat(
                    'yyyy-MM-dd'
                ),
                // Default values
                integrator: integrator,
                status: 'Active',
                installationConfiguration: 'StandAlone'
            };
        case integrators.Integrator.NSR:
            return {
                externalId: obj.externalId,
                projectName: obj.projectName,
                latitude: Number(obj.latitude),
                longitude: Number(obj.longitude),
                countryCode: obj.countryCode,
                capacity: obj.capacity * 10 ** 3,
                fuelCode: obj.fuelCode,
                deviceTypeCode: obj.deviceTypeCode,
                installationConfiguration: obj.installationconfiguration,
                gridInterconnection: obj.gridInterconnection,
                standardCompliance: obj.standardcompliance,
                offTaker: obj.offTaker,
                sector: obj.sector,
                commissioningDate: DateTime.fromJSDate(new Date(obj.commissioningdate)).toFormat(
                    'yyyy-MM-dd'
                ),
                // Default values
                integrator: integrator,
                status: 'Active',
                yieldValue: 1500
            };
        case integrators.Integrator.CANDI:
            return {
                externalId: obj.externalId,
                projectName: obj.projectName,
                latitude: Number(obj.latitude),
                longitude: Number(obj.longitude),
                countryCode: obj.countryCode,
                capacity: parseInt(obj.capacity) * 10 ** 3,
                address: obj.address,
                zipCode: `${obj.zipCode}`,
                fuelCode: obj.fuelCode,
                deviceTypeCode: obj.deviceTypeCode,
                installationConfiguration: obj.installationConfiguration,
                gridInterconnection: obj.gridInterconnection,
                offTaker: obj.offTaker,
                sector: obj.sector,
                commissioningDate: DateTime.fromJSDate(new Date(obj.commissioningDate)).toFormat(
                    'yyyy-MM-dd'
                ),
                // Default values
                integrator: integrator,
                status: 'Active',
                yieldValue: 1500,
                standardCompliance: 'REC'
            };
        case integrators.Integrator.BBOX:
            return {
                externalId: obj.externalId,
                projectName: obj.projectName,
                latitude: Number(obj.latitude),
                longitude: Number(obj.longitude),
                countryCode: obj.countryCode,
                capacity: parseInt(obj.capacity),
                address: obj.address,
                zipCode: `${obj.zipCode}`,
                fuelCode: obj.fuelCode,
                deviceTypeCode: obj.deviceTypeCode,
                installationConfiguration: obj.installationConfiguration,
                gridInterconnection: obj.gridInterconnection,
                offTaker: obj.offTaker,
                sector: obj.sector,
                commissioningDate: DateTime.fromJSDate(new Date(obj.commissioningDate)).toFormat(
                    'yyyy-MM-dd'
                ),
                yieldValue: obj.yieldValue,
                standardCompliance: obj.standardCompliance,
                // Default values
                integrator: integrator,
                status: 'Active'
            };
    }
};

const transform = (arr, integrator) => {
    if (!arr.length) {
        return;
    }
    const devices = arr.map((obj) => {
        return getIntegratorDefaultValues(obj, integrator);
    });
    return devices;
};

const generateIntegratorDevices = (arr, integrator) => {
    const devices = transform(arr, integrator);
    let data = JSON.stringify(devices);
    fs.writeFileSync(`./integrator-devices/${integrator}-devices.json`, data);
};

const runGenerateIntegrators = () => {
    generateIntegratorDevices(okraProducts, integrators.Integrator.OKRA);
    generateIntegratorDevices(engieProducts, integrators.Integrator.ENGIE);
    generateIntegratorDevices(distributedEnergyProducts, integrators.Integrator.DISTRIBUTED_ENERGY);
    generateIntegratorDevices(nsrProducts, integrators.Integrator.NSR);
    generateIntegratorDevices(candiProducts, integrators.Integrator.CANDI);
    generateIntegratorDevices(bboxProducts, integrators.Integrator.BBOX);
};

module.exports = {
    runGenerateIntegrators
};
