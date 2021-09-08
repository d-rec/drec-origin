import axios, { AxiosRequestConfig } from 'axios';
import { getAuthenticationToken } from 'shared';

export const useAxiosInterceptors = () => {
    axios.interceptors.request.use((config: AxiosRequestConfig): AxiosRequestConfig => {
        config.baseURL = process.env.REACT_APP_BACKEND_URL;
        config.headers.authorization = `Bearer ${getAuthenticationToken()}`;
        return config;
    });

    axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            return Promise.reject(error);
        }
    );
};
