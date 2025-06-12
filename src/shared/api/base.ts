import axios, { AxiosInstance} from 'axios';

import { ApiError } from '@/shared/api/model/Response';

abstract class BaseApi {

  abstract apiInstance: AxiosInstance;

  protected handleApiError(error: unknown, defaultMessage: string, defaultStatus: number): ApiError {
    let message = defaultMessage;
    let status = defaultStatus;

    if (axios.isAxiosError(error)) {
      message = error.response?.data?.message || message;
      status = error.response?.status || status;
    } else if (error instanceof Error) {
      message = error.message;
    }

    return {
      message,
      status,
    };
  }
}

export default BaseApi;
