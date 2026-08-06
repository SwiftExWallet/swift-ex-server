import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '../alchemy/http.service';
import { GetPortfolioData } from './dto/getPortfolioData';
import { PortfolioRepository } from './portfolio.repository';
import { PortfolioMapper } from './portfolio.mapper';
import { Portfolio } from './schema/portfolio.schema';
import { AlchemyPortfolioResponse } from './interfaces/portfolio-sync.interface';

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);
  private readonly url: string;
  private readonly SYNC_TTL_MS =
    Number(process.env.PORTFOLIO_SYNC_TTL_SECONDS ?? 35) * 1000;

  constructor(
    private readonly httpService: HttpService,
    private readonly portfolioRepository: PortfolioRepository,
    private readonly portfolioMapper: PortfolioMapper,
  ) {
    this.url = `https://api.g.alchemy.com/data/v1/${process.env.ALCHEMY_PORTFOLIO_KEY}/assets/tokens/by-address`;
  }

  async getPortfolio(
    deviceId: string,
    address: string,
    hardRefresh = false,
  ): Promise<AlchemyPortfolioResponse> {
    address = address.toLowerCase();

    const existing = await this.portfolioRepository.findByAddress(address);

    const canForceRefresh =
      hardRefresh &&
      !!existing?.lastSyncedAt &&
      Date.now() - existing.lastSyncedAt.getTime() >= this.SYNC_TTL_MS;

    const shouldFetch = !existing || existing.stale || canForceRefresh;

    if (!shouldFetch) {
      if (String(existing.deviceId) !== String(deviceId)) {
        await this.portfolioRepository.updateDevice(address, deviceId);
      }
      return this.portfolioMapper.toAlchemyResponse(existing as Portfolio);
    }

    try {
      const raw = await this.fetchFromAlchemy(address);
      const { tokens, totalValueUsd } = this.portfolioMapper.normalize(raw);
      const saved = await this.portfolioRepository.upsert(
        deviceId,
        address,
        tokens,
        totalValueUsd,
      );
      return this.portfolioMapper.toAlchemyResponse(saved);
    } catch (error) {
      this.logger.error('Failed to sync portfolio from Alchemy', {
        deviceId,
        address,
        error,
      });
      
      if (existing) {
        await this.portfolioRepository.markFailed(
          address,
          (error as Error).message,
        );
        return this.portfolioMapper.toAlchemyResponse(existing as Portfolio);
      }
      throw new BadGatewayException('Failed to fetch portfolio');
    }
  }

  private async fetchFromAlchemy(
    address: string,
  ): Promise<AlchemyPortfolioResponse> {
    const body: GetPortfolioData = {
      addresses: [
        {
          address,
          networks: [
            'eth-mainnet',
            'bnb-mainnet',
            'polygon-mainnet',
            'arb-mainnet',
            'base-mainnet',
            'avax-mainnet',
            'opt-mainnet',
          ],
        },
      ],
      withMetadata: true,
      withPrices: true,
      includeNativeTokens: true,
      includeErc20Tokens: true,
    };
    const response = await this.httpService.post(this.url, body);
    return response.data as AlchemyPortfolioResponse;
  }
}
