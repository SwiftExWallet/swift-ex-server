import { IsString, IsNumber, IsOptional } from 'class-validator';

export class SellOrderDto {
  @IsString()
  appId: string = process.env.ALCHEMY_PAY_APPID ?? '';

  @IsString()
  type: string = 'sell';

  @IsString()
  crypto: string;

  @IsString()
  network: string;

  @IsNumber()
  cryptoAmount: number;

  @IsString()
  fiat: string;

  @IsString()
  country: string;

  @IsString()
  redirectUrl: string = process.env.ALCHEMY_PAY_SELL_REDIRECT ?? '';

  @IsString()
  callbackUrl: string = process.env.ALCHEMY_PAY_SELL_WEBHOOK ?? '';

  @IsString()
  language: string = 'en-US';

  @IsString()
  showTable: string = 'sell';
}
