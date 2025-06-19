import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';

import { ApiError } from '@/shared/api/model/Response';

interface InvalidResponse {
  message: string,
  extensions: {
    code: string
  }
}
abstract class BaseApi {
  constructor(public apiInstance: AxiosInstance) {
    axiosRetry(this.apiInstance, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return error.response?.status === 502;
      }
    });
  }

  protected handleApiError(error: unknown, defaultMessage: string, defaultStatus: number): ApiError {
    let message = defaultMessage;
    let status = defaultStatus;

    if (axios.isAxiosError(error)) {
      const response = error.response;

      if ((response?.status === 400 || response?.status === 401) && Array.isArray(response?.data?.errors)) {
        message = response.data.errors.map((e: InvalidResponse) => e.message).join('; ');
      } else {
        message = response?.data?.message || message;
      }

      status = response?.status || status;
    } else if (error instanceof Error) {
      message = error.message;
    }
    return { message, status };
  }
}

export default BaseApi;
