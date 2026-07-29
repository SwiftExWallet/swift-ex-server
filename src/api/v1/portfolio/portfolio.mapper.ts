import { Injectable } from '@nestjs/common';
import { Portfolio, PortfolioToken } from './schema/portfolio.schema';
import { AlchemyPortfolioResponse } from './interfaces/portfolio-sync.interface';

const NATIVE_TOKEN_META: Record<
  string,
  { symbol: string; name: string; decimals: number }
> = {
  'eth-mainnet': { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  'bnb-mainnet': { symbol: 'BNB', name: 'BNB', decimals: 18 },
  'matic-mainnet': { symbol: 'POL', name: 'Polygon', decimals: 18 },
  'arb-mainnet': { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  'base-mainnet': { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  'opt-mainnet': { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  'avax-mainnet': { symbol: 'AVAX', name: 'Avalanche', decimals: 18 },
};

function hexToDecimalString(hex: string, decimals: number): string {
  const raw = BigInt(hex);
  if (raw === 0n) return '0';
  const divisor = 10n ** BigInt(decimals);
  const whole = raw / divisor;
  const fraction = raw % divisor;
  if (fraction === 0n) return whole.toString();
  const fractionStr = fraction
    .toString()
    .padStart(decimals, '0')
    .replace(/0+$/, '');
  return fractionStr ? `${whole}.${fractionStr}` : whole.toString();
}

export interface NormalizedPortfolio {
  tokens: PortfolioToken[];
  totalValueUsd: string;
}

@Injectable()
export class PortfolioMapper {
  normalize(response: AlchemyPortfolioResponse): NormalizedPortfolio {
    const entries = response?.data?.tokens ?? [];
    const tokens: PortfolioToken[] = [];
    let totalValueUsd = 0;

    for (const entry of entries) {
      if (BigInt(entry.tokenBalance) === 0n) continue;

      const isNative = entry.tokenAddress === null;
      const nativeMeta = NATIVE_TOKEN_META[entry.network];

      const decimals =
        entry.tokenMetadata.decimals ??
        (isNative ? (nativeMeta?.decimals ?? null) : null);
      const symbol =
        entry.tokenMetadata.symbol ?? (isNative ? (nativeMeta?.symbol ?? null) : null);
      const name =
        entry.tokenMetadata.name ?? (isNative ? (nativeMeta?.name ?? null) : null);

      const usdPrice = entry.tokenPrices.find((p) => p.currency === 'usd');
      const priceUsd = usdPrice?.value ?? null;
      const priceUpdatedAt = usdPrice?.lastUpdatedAt ?? null;
      const balance =
        decimals !== null ? hexToDecimalString(entry.tokenBalance, decimals) : null;
      const valueUsd =
        balance !== null && priceUsd !== null
          ? (Number(balance) * Number(priceUsd)).toString()
          : null;

      if (valueUsd) totalValueUsd += Number(valueUsd);

      tokens.push({
        network: entry.network,
        tokenAddress: entry.tokenAddress,
        symbol,
        name,
        decimals,
        logo: entry.tokenMetadata.logo,
        balanceHex: entry.tokenBalance,
        balance,
        priceUsd,
        priceUpdatedAt,
        valueUsd,
      } as PortfolioToken);
    }

    return { tokens, totalValueUsd: totalValueUsd.toString() };
  }

  toAlchemyResponse(portfolio: Portfolio): AlchemyPortfolioResponse {
    return {
      data: {
        tokens: portfolio.tokens.map((token) => ({
          address: portfolio.address,
          network: token.network,
          tokenAddress: token.tokenAddress,
          tokenBalance: token.balanceHex,
          tokenMetadata: {
            symbol: token.symbol,
            decimals: token.decimals,
            name: token.name,
            logo: token.logo,
          },
          tokenPrices:
            token.priceUsd !== null
              ? [
                  {
                    currency: 'usd',
                    value: token.priceUsd,
                    lastUpdatedAt: token.priceUpdatedAt ?? '',
                  },
                ]
              : [],
        })),
      },
    };
  }
}
