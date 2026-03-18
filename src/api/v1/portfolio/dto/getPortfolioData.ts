class PortfolioAddress {
  address: string;
  networks: string[];
}

export class GetPortfolioData {
  addresses: PortfolioAddress[];
  withMetadata: boolean;
  withPrices: boolean;
  includeNativeTokens: boolean;
  includeErc20Tokens: boolean;
}
