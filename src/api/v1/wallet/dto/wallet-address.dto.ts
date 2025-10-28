import { IsEnum, IsEthereumAddress, IsNotEmpty } from 'class-validator';
import { SupportedWalletChain } from 'src/common/enum/chain';

export class WalletAddressDto {
  @IsNotEmpty()
  @IsEthereumAddress()
  walletAddress: string;

  @IsNotEmpty()
  @IsEnum(SupportedWalletChain)
  chain: SupportedWalletChain;
}
