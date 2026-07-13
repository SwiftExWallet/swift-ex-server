import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AlchemyMethod } from '../../../common/enum/alchemy.enum';
import { AxiosHeaders } from 'axios';
import { AxiosResponse } from '../../../common/interface/axiosResponse';
import { AssetsDto, OrderType, QuotesDto } from './dto/banxa-quotes.dto';
import { BanxaHttpService } from './banxa-http.service';
import { CreateOrderDto } from './dto/banxa-create-order.dto';
import { User } from '../users/schema/user.schema';
import { Device } from '../device/schema/device.schema';

@Injectable()
export class BanxaService {
  private readonly logger = new Logger(BanxaService.name);
  private readonly banxaApiKey = process.env.BANXA_API_KEY as string;
  private readonly banxaQuoteRoute = process.env.BANXA_QUOTE_REQUEST_URL as string;
  private readonly banxaBaseRoute = process.env.BANXA_BASE_URL as string;
  constructor(
    private readonly banxaHttpService: BanxaHttpService,
  ) { }

  async fetchQuotes(payload: QuotesDto): Promise<AxiosResponse> {
    try {
      this.logger.log('====fetching banxa quotes started===');
      const headers: AxiosHeaders = this.buildAppHeaders(this.banxaApiKey);
      return this.banxaHttpService.request({
        body: payload,
        method: AlchemyMethod.GET,
        url: this.banxaQuoteRoute + payload.orderType as string,
        headers,
      });
    } catch (error) {
      this.logger.error('failed to fetching banxa quotes: ', error);
      throw new BadRequestException(`failed to fetching banxa quotes: ${error.message}`);
    }
  }

  async buyOrderCreate(createOrder: CreateOrderDto, currentDevice: Device): Promise<AxiosResponse | void> {
    try {
      this.logger.log('====banxa buy order create started===');
      const headers: AxiosHeaders = this.buildAppHeaders(this.banxaApiKey);
      const payload = {
        ...createOrder,
        externalOrderId: currentDevice._id.toString(),
        externalCustomerId: currentDevice._id.toString(),
        redirectUrl: process.env.BANXA_REDIRECT_URL
      };
      return this.banxaHttpService.request({
        body: payload,
        method: AlchemyMethod.POST,
        url: this.banxaBaseRoute + "v2/buy" as string,
        headers,
      });
    } catch (error) {
      this.logger.error('failed to create banxa buy order: ', error);
      throw new BadRequestException(`failed to create banxa buy order: ${error.message}`);
    }
  }

  async sellOrderCreate(createOrder: CreateOrderDto, currentDevice: Device): Promise<AxiosResponse | void> {
    try {
      this.logger.log('====banxa sell order create started===');
      const headers: AxiosHeaders = this.buildAppHeaders(this.banxaApiKey);
      const payload = {
        ...createOrder,
        externalCustomerId: currentDevice._id.toString(),
        externalOrderId: currentDevice._id.toString(),
        redirectUrl: process.env.BANXA_REDIRECT_URL
      };
      return this.banxaHttpService.request({
        body: payload,
        method: AlchemyMethod.POST,
        url: this.banxaBaseRoute + "v2/sell" as string,
        headers,
      });
    } catch (error) {
      this.logger.error('failed to create banxa sell order: ', error);
      throw new BadRequestException(`failed to create banxa sell order: ${error.message}`);
    }
  }

  async fetchAssets(payload: AssetsDto): Promise<AxiosResponse> {
    try {
      const headers: AxiosHeaders = this.buildAppHeaders(this.banxaApiKey);

      if (payload.orderType === OrderType.BUY) {
        return this.fetchBuyAssets(payload, headers);
      }

      return this.fetchSellAssets(payload, headers);
    } catch (error) {
      this.logger.error('failed to fetching banxa assets: ', error);
      throw new BadRequestException(
        `failed to fetching banxa assets: ${error.message}`,
      );
    }
  }

  private async fetchBuyAssets(
    payload: AssetsDto,
    headers: AxiosHeaders,
  ): Promise<AxiosResponse> {
    const [crypto, fiats, paymentMethods] = await Promise.all([
      this.banxaHttpService.get({
        body: payload,
        method: AlchemyMethod.GET,
        url: this.banxaBaseRoute + `v2/crypto` as string,
        headers,
      }),
      this.banxaHttpService.get({
        body: payload,
        method: AlchemyMethod.GET,
        url: this.banxaBaseRoute + `v2/fiats` as string,
        headers,
      }),
      this.banxaHttpService.get({
        body: payload,
        method: AlchemyMethod.GET,
        url: this.banxaBaseRoute + `v2/payment-methods` as string,
        headers,
      }),
    ]);
    return {
      ...crypto,
      data: {
        status: true,
        order_type: OrderType.BUY,
        crypto_assets: crypto.data ?? [],
        fiat_currencies: fiats.data ?? [],
        payment_methods: (paymentMethods.data?.data?.payment_methods ?? []).filter(
          (pm: { type: string }) => pm.type === 'buy',
        ),
      },
    };
  }

  private async fetchSellAssets(
    payload: AssetsDto,
    headers: AxiosHeaders,
  ): Promise<AxiosResponse> {
    const [crypto, paymentMethods, countries] = await Promise.all([
      this.banxaHttpService.get({
        body: payload,
        method: AlchemyMethod.GET,
        url: this.banxaBaseRoute + `v2/crypto` as string,
        headers,
      }),
      this.banxaHttpService.get({
        body: payload,
        method: AlchemyMethod.GET,
        url: this.banxaBaseRoute + `v2/payment-methods` as string,
        headers,
      }),
      this.banxaHttpService.get({
        body: payload,
        method: AlchemyMethod.GET,
        url: this.banxaBaseRoute + `v2/countries?orderType=${payload.orderType}` as string,
        headers,
      }),
    ]);
    return {
      ...crypto,
      data: {
        status: true,
        order_type: OrderType.SELL,
        crypto_assets: crypto.data ?? [],
        payout_methods: paymentMethods.data ?? [],
        supported_countries: (countries.data?.data?.countries ?? []).map(
          (c: { country_code: string }) => c.country_code,
        ),
      },
    };
  }

  private buildAppHeaders(apiKey: string) {
    const headers = new AxiosHeaders();
    headers.set('x-api-key', apiKey);
    headers.set('Content-Type', 'application/json');
    return headers;
  }
}
