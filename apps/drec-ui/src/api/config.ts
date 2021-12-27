import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { getAuthenticationToken, removeAuthenticationToken } from 'shared';

const isUnauthorized = (response: AxiosResponse) => response?.status === 401;

export const useAxiosInterceptors = () => {
    axios.interceptors.request.use((config: AxiosRequestConfig): AxiosRequestConfig => {
        config.baseURL = process.env.REACT_APP_BACKEND_URL;
        config.headers.authorization = `Bearer ${getAuthenticationToken()}`;
        return config;
    });

    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            const authToken = getAuthenticationToken();
            if (isUnauthorized(error?.response) && authToken) {
                removeAuthenticationToken();
            }
        }
    );
};
