import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { WalletAddressDto } from './dto/wallet-address.dto';
import { StellarAddressDto } from './dto/stellar-address.dto';

@Controller('api/v1/wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}
  @Post()
  async create(@Res() response, @Body() createWalletDto: CreateWalletDto) {
    const wallet = await this.walletService.create(createWalletDto);
    response.status(201).json({ wallet });
  }

  @Get('multiChain/:walletAddress')
  async findByMultiChainAddress(
    @Res() response,
    @Param() walletAddressDto: WalletAddressDto,
  ) {
    const wallets =
      await this.walletService.findByMultiChainAddress(walletAddressDto);
    return response.status(200).json({ wallets });
  }

  @Get('stellar/:stellarAddress')
  async findByStellarAddress(
    @Res() response,
    @Param() stellarAddressDto: StellarAddressDto,
  ) {
    const wallets =
      await this.walletService.findByStellarAddress(stellarAddressDto);
    return response.status(200).json({ wallets });
  }

  @Get('user/')
  async findByUser(@Res() response, @Req() req: any) {
    const wallets = await this.walletService.findWalletByUserId(
      req.CurrentUser._id,
    );
    return response.status(200).json({ wallets });
  }

  @Patch('assignUser')
  assignUser(@Req() req: any, @Param() stellarAddressDto: StellarAddressDto) {
    return this.walletService.assignUser(stellarAddressDto, req.CurrentUser);
  }

  @Patch('activateWallet')
  activateWallet(
    @Req() req: any,
    @Param() stellarAddressDto: StellarAddressDto,
  ) {
    return this.walletService.activateWallet(
      stellarAddressDto,
      req.device,
      req.CurrentUser,
    );
  }
}
