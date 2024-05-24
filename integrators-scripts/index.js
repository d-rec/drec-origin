'use strict';

require('dotenv').config();
const deviceGenerator = require('./device-generator');
const postReads = require('./post-reads');
const postDevices = require('./post-devices');

// Before running the script, make sure
/*
    1. You have updated the DREC_BACKEND_URL in .env with local or heroku - also update the username and password for each integrator
    2. Post generated devices to Server - Bulk Devices
    3. You updated DREC_USERNAME & DREC_PASSWORD with the Owner credentials based on the integrator (Okra, BBOX, Engie etc.)
*/
(async () => {
  // These methods should run independently
  // After each step, comment the completed step, uncomment the next step and restart the server
  // Run this 1st - This will create JSON files for each developer
  // deviceGenerator.runGenerateIntegrators();
  // Run this 2nd - This will upload all devices for each developer in the specified environment
  // await postDevices.postOkraDevices();
  // await postDevices.postNSRDevices();
  // await postDevices.postDistributedEnergyDevices();
  // await postDevices.postCandiDevices();
  // await postDevices.postEngieDevices();
  // await postDevices.postBBOXDevices();
  // Run this 3rd - This will upload meter reads for each device
  // await postReads.postOkraReads();
  // await postReads.postNSRReads();
  // await postReads.postEngieReads();
  // await postReads.postDistributedEnergyReads();
  // await postReads.postCandiReads();
  // Run this 4th for daily reads - This will upload daily meter reds for each deie
  // await postReads.postOkraReadsDAILY();
  // await postReads.postNSRReadsDAILY();
  // await postReads.postCandiReadsDAILY();
})();
