import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UrlSigner } from './util/urlSigner';
import { AlchemyMethod } from '../../../common/enum/alchemy.enum';
import { HttpService } from './http.service';
import { AxiosHeaders } from 'axios';
import * as crypto from 'crypto';
import { AxiosResponse } from '../../../common/interface/axiosResponse';
import { CreateBuyOrderDto } from './dto/alchemy-create-order.dto';
import { buildAlchemySellOrderPayload, SellOrderDto } from './dto/alchemy-sell-order.dto';
import { User } from '../users/schema/user.schema';

@Injectable()
export class AlchemyService {
  private readonly logger = new Logger(UrlSigner.name);
  constructor(
    private readonly urlSigner: UrlSigner,
    private readonly httpService: HttpService,
  ) {}

  async fetchQuotes(payload: Record<string, any>): Promise<AxiosResponse> {
    try {
      this.logger.log('==== getting alchemy quotes started===');
      //   const timestamp = Date.now().toString(); // can we change it to iso string ?
      const timestamp = Date.now().toString();
      const sign: string = await this.urlSigner.signPayload(
        timestamp,
        payload,
        AlchemyMethod.POST,
        process.env.QUOTE_REQUEST_URL as string,
      );
      this.logger.log('==== fetching alchemy quotes ===');
      const headers: AxiosHeaders = this.buildAppHeaders(timestamp, sign);
      this.logger.log('==== getting alchemy quotes end===');
      return this.httpService.request({
        body: payload,
        method: AlchemyMethod.POST,
        url: process.env.QUOTE_REQUEST_URL as string,
        headers,
      });
    } catch (error) {
      this.logger.error('fetchQuotes Error', error);
      throw new BadRequestException(`fetching Quotes failed: ${error.message}`);
    }
  }

  async registerUser(payload: any): Promise<AxiosResponse> {
    try {
      const timestamp = new Date().toISOString();
      const sign: string = await this.urlSigner.signPayload(
        timestamp,
        payload,
        AlchemyMethod.POST,
        process.env.REGISTER_USER_REQUEST_URL as string,
      );
      const headers: AxiosHeaders = this.buildAchAccessHeaders(timestamp, sign);

      return this.httpService.request({
        body: payload,
        method: AlchemyMethod.POST,
        url: process.env.REGISTER_USER_REQUEST_URL as string,
        headers,
      });
    } catch (error) {
      this.logger.error('alchemyUserRegister Error', error);
      throw new BadRequestException(
        `AlchemyUserRegister failed: ${error.message}`,
      );
    }
  }

  async userStatus(payload): Promise<AxiosResponse> {
    try {
      this.logger.log('==== alchemy user status check started ===');
      const timestamp = new Date().toISOString();
      const sign: string = await this.urlSigner.signPayload(
        timestamp,
        payload,
        AlchemyMethod.POST,
        process.env.USER_KYC_STATUS_REQUEST_URL as string,
      );
      const headers: AxiosHeaders = this.buildAchAccessHeaders(timestamp, sign);

      return this.httpService.request({
        body: payload,
        method: AlchemyMethod.POST,
        url: process.env.USER_KYC_STATUS_REQUEST_URL as string,
        headers,
      });
    } catch (error) {
      this.logger.error('alchemyUserStatus Error', error);
      throw new BadRequestException(
        `alchemyUserStatus failed: ${error.message}`,
      );
    }
  }

  async orderCreate(
    createBuyOrderDto: CreateBuyOrderDto,
    user: User,
  ): Promise<AxiosResponse | void> {
    const { email } = user;
    this.logger.log('==== creating alchemy buy started===');
    const orderTimestamp = Date.now().toString();
    const payload = Object.assign(createBuyOrderDto, {
      side: 'BUY',
      merchantOrderNo: Math.floor(
        1000000000 + Math.random() * 9000000000,
      ).toString(),
      depositType: 2,
      redirectUrl: process.env.ALCHEMY_PAY_REDIRECT_URL,
      callbackUrl: process.env.ALCHEMY_PAY_WEBHOOK_URL,
    });
    this.logger.log('==== creating alchemy buy order ===');
    const signKey: string = await this.urlSigner.signPayload(
      orderTimestamp,
      payload,
      AlchemyMethod.POST,
      process.env.ORDER_CREATION_REQUEST_URL as string,
    );
    const userTokenTimestamp = String(Date.now());

    const accessToken = await this.getAuthAccessToken(
      userTokenTimestamp,
      email,
    );
    this.logger.log('==== creating alchemy access token ===');
    if (!accessToken.status) {
      throw new BadRequestException('Error in access token creation');
    }
    const orderCreationAccessTokenData = JSON.parse(accessToken.data);

    const headers = this.buildAppHeaders(orderTimestamp, signKey);

    headers.set('access-token', orderCreationAccessTokenData.data.accessToken);
    this.logger.log('==== alchemy buy order created ===');
    return this.httpService.request({
      body: payload,
      method: AlchemyMethod.POST,
      url: process.env.ORDER_CREATION_REQUEST_URL as string,
      headers,
    });
  }

  async sellOrderCreate(payload: SellOrderDto, user: User): Promise<string> {
    const { email } = user;
    this.logger.log('==== creating alchemy sell order ===');
      const sellFianlPayload=buildAlchemySellOrderPayload(payload)

      const rawDataToSign = this.getStringToSign(sellFianlPayload);
      const requestPathWithParams =
        process.env.USER_SELL_ORDER_REQUEST_URL + '?' + rawDataToSign;
      const onRampSignature = this.generateSignature(
        sellFianlPayload.timestamp,
        AlchemyMethod.GET,
        requestPathWithParams,
        process.env.ALCHEMY_PAY_SECRET as string,
      );
      this.logger.log('==== alchemy sell order created ===');
      const finalUrl =
        process.env.USER_SELL_ORDER_URL +
        rawDataToSign +
        '&sign=' +
        onRampSignature;

      return finalUrl;
  }

  // Function to sort parameters and return a string to sign
  private getStringToSign(params) {
    const sortedKeys = Object.keys(params).sort();
    this.logger.log('==== alchemy sorted Keys creation started===');
    const s2s = sortedKeys
      .map((key) => {
        const value = params[key];
        if (Array.isArray(value) || value === '') {
          return null;
        }
        return `${key}=${value}`;
      })
      .filter(Boolean)
      .join('&');
      this.logger.log('==== alchemy sorted Keys creation end===');
    return s2s;
  }

  // Function to generate HMAC SHA256 signature
  private generateSignature(timestamp, httpMethod, requestPath, secretKey) {
    // Concatenate parameters for signature string
    this.logger.log('==== alchemy signature creation started===');
    const signatureString = timestamp + httpMethod + requestPath;

    // Generate HMAC SHA256 signature using the secret key
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(signatureString);
    const signature = hmac.digest('base64');
    this.logger.log('==== alchemy signature creation end===');
    return encodeURIComponent(signature);
  }

  private buildAppHeaders(timestamp: string, sign: string) {
    const headers = new AxiosHeaders();
    headers.set('appid', process.env.ALCHEMY_PAY_APPID as string);
    headers.set('timestamp', timestamp);
    headers.set('sign', sign);
    headers.set('Content-Type', 'application/json');
    return headers;
  }

  private buildAchAccessHeaders(timestamp: string, sign: string) {
    const headers = new AxiosHeaders();
    headers.set('ach-access-key', process.env.ALCHEMY_PAY_APPID as string);
    headers.set('ach-access-timestamp', timestamp.toString());
    headers.set('ach-access-sign', sign);
    headers.set('Content-Type', 'application/json');
    return headers;
  }

  private async getAuthAccessToken(timestamp: string, email: string) {
    this.logger.log('==== getting alchemy auth access token started===');
    const sign: string = await this.urlSigner.signPayload(
      timestamp,
      { email },
      AlchemyMethod.POST,
      process.env.USER_AUTH_TOKEN_REQUEST_URL as string,
    );
    const headers: AxiosHeaders = this.buildAppHeaders(timestamp, sign);
    this.logger.log('==== getting alchemy auth access token end===');
    return this.httpService.request({
      body: { email },
      method: AlchemyMethod.POST,
      url: process.env.USER_AUTH_TOKEN_REQUEST_URL as string,
      headers,
    });
  }
}
