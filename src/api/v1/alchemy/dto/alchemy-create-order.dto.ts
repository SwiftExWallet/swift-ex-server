import { IsString, IsNumber, IsIn, IsOptional } from 'class-validator';

export class CreateBuyOrderDto {
  @IsIn(['BUY'])
  side: string;

  @IsNumber()
  amount: string;

  @IsString()
  fiatCurrency: string;

  @IsString()
  cryptoCurrency: string;

  @IsNumber()
  depositType: number = 2;

  @IsString()
  address: string;

  @IsString()
  network: string;

  @IsString()
  alpha2: string;

  @IsString()
  orderType: string;

  @IsString()
  payWayCode: string;

  @IsString()
  userAccountId: string =  process.env.ALCHEMY_PAY_ACCOUNT_ID ?? '';

  @IsString()
  redirectUrl: string = process.env.ALCHEMY_PAY_REDIRECT_URL ?? '';

  @IsString()
  callbackUrl: string = process.env.ALCHEMY_PAY_WEBHOOK_URL ?? '';

  @IsOptional()
  @IsString()
  memo?: string;
}
