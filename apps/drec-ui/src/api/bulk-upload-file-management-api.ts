import axios from 'axios';

export const jobCreateForCSVFile = async (request:{fileName:string}) => {
    return await axios.post(`api/device-group/process-creation-bulk-devices-csv`,request);
};

export const getJobDetailsForJobId = async (jobId:string) => {
    return await axios.get(`api/device-group/bulk-upload-status/${jobId}`);
};


export const getAllJobDetailsOfOrganization = async () => {
    return await axios.get(`api/device-group/bulk-upload/get-all-csv-jobs-of-organization`);
};
