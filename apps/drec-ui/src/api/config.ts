import axios, { AxiosRequestConfig } from 'axios';
import { getAuthenticationToken } from 'shared';

declare global {
    interface Window {
        config: {
            REACT_APP_BACKEND_URL: string;
            REACT_APP_GOOGLE_MAPS_API_KEY: string;
            REACT_APP_REGISTRATION_MESSAGE_TO_SIGN: string;
            REACT_APP_SUPPORTED_NETWORK_IDS: string;
        };
    }
}

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
