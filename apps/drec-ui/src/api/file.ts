import axios from 'axios';
import {
    fileControllerUpload,
    fileControllerUploadAnonymously
} from '@energyweb/origin-drec-api-client';

export const fileDownloadHandler = async (id: string) => {
    return await axios.get(`api/file/${id}`);
};

export const publicFileDownloadHandler = async (id: string) => {
    return await axios.get(`api/file/public/${id}`);
};

export const fileUploadHandler = async (file: Blob[]) => {
    // API returns 500 Server Error
    console.log('FILES to upload from file.ts: ', file);
    return await fileControllerUpload({ files: file });
};

export const publicFileUploadHandler = async (file: Blob[]) => {
    return await fileControllerUploadAnonymously({ files: file });
};
