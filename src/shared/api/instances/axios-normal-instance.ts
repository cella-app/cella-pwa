import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { API_URL } from '@/shared/config/env';

const axiosNormalInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosNormalInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosNormalInstance;
