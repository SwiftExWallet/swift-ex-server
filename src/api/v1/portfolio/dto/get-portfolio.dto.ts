import { IsEthereumAddress, IsNotEmpty } from 'class-validator';

export class GetPortfolioDto {
  @IsNotEmpty()
  @IsEthereumAddress()
  address: string;
}
