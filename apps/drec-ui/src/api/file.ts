import axios from 'axios';
import { fileControllerUpload } from '@energyweb/origin-drec-api-client';

export const fileDownloadHandler = async (id: string) => {
    return await axios.get(`api/file/${id}`);
};

export const publicFileDownloadHandler = async (id: string) => {
    return await axios.get(`api/file/public/${id}`);
};

export const fileUploadHandler = async (file: Blob[]) => {
    return await fileControllerUpload({ files: file });
};
