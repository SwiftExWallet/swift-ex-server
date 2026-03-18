import { Injectable } from '@nestjs/common';
import { HttpService } from '../alchemy/http.service';
import { GetPortfolioData } from './dto/getPortfolioData';

@Injectable()
export class PortfolioService {
  url: string = '';

  constructor(private readonly httpService: HttpService) {
    this.url = `https://api.g.alchemy.com/data/v1/${process.env.ALCHEMY_PORTFOLIO_KEY}/assets/tokens/by-address`;
  }

  getPortfolioByAddress(address: string) {
    const body: GetPortfolioData = {
      addresses: [
        {
          address,
          networks: (process.env.PORTFOLIO_NETWORKS as string).split(','),
        },
      ],
      withMetadata: true,
      withPrices: true,
      includeNativeTokens: true,
      includeErc20Tokens: true,
    };
    return this.httpService.post(this.url, body);
  }
}
