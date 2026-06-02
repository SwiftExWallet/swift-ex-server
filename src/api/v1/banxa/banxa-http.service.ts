import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { AxiosResponse } from '../../../common/interface/axiosResponse';
import { AlchemyRequestDto } from '../alchemy/dto/alchemy-request.dto';

@Injectable()
export class BanxaHttpService {
  async request(alchemyRequestDto: AlchemyRequestDto): Promise<AxiosResponse> {
    try {
      const { body, method, url, headers } = alchemyRequestDto;
      let config: AxiosRequestConfig = {
        method: method,
        maxBodyLength: Infinity,
        url: url,
        headers,
        data: JSON.stringify(body),
      };
      const response = await axios.request(config);
      return {
        status: response?.data?.success,
        data: {
          ...body,
          ...response.data
        }
      };
    } catch (error) {
      console.error("error in http request", error.response.data)
      const errorsObj = error.response.data?.errors;
      let defaultMessage = 'Error in http request.';
      if (errorsObj && typeof errorsObj === 'object') {
        const firstKey = Object.keys(errorsObj)[0];
        if (firstKey && Array.isArray(errorsObj[firstKey])) {
          defaultMessage = errorsObj[firstKey][0];
        }
      }
      throw new HttpException(
        defaultMessage,
        error.response.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  async put(url: string, body: any, headers?: Record<string, string>) {
    if (headers) {
      return axios.put(url, body, { headers });
    }
    return axios.put(url, body);
  }

  async get(alchemyRequestDto: AlchemyRequestDto): Promise<AxiosResponse> {
    try {
      const {method, url, headers } = alchemyRequestDto;
      let config: AxiosRequestConfig = {
        method: method,
        maxBodyLength: Infinity,
        url: url,
        headers,
      };
      const response = await axios.request(config);
      return {
        status: response?.data?.success,
        data: {
          ...response.data
        }
      };
    } catch (error) {
      console.error("error in http request", error.response.data)
      const errorsObj = error.response.data?.errors;
      let defaultMessage = 'Error in http request.';
      if (errorsObj && typeof errorsObj === 'object') {
        const firstKey = Object.keys(errorsObj)[0];
        if (firstKey && Array.isArray(errorsObj[firstKey])) {
          defaultMessage = errorsObj[firstKey][0];
        }
      }
      throw new HttpException(
        defaultMessage,
        error.response.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
