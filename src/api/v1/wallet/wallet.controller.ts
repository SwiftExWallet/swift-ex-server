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
  async create(
    @Req() req: any,
    @Res() response,
    @Body() createWalletDto: CreateWalletDto,
  ) {
    const wallet = await this.walletService.create(
      createWalletDto,
      req.device._id,
    );
    response.status(201).json({ wallet });
  }

  @Get(':walletAddress/multiChain')
  async findByMultiChainAddress(
    @Req() req: any,
    @Res() response,
    @Param() walletAddressDto: WalletAddressDto,
  ) {
    const wallets = await this.walletService.findByMultiChainAddress(
      walletAddressDto,
      req.device._id,
    );
    return response.status(200).json({ wallets });
  }

  @Get(':stellarAddress/stellar')
  async findByStellarAddress(
    @Req() req: any,
    @Res() response,
    @Param() stellarAddressDto: StellarAddressDto,
  ) {
    const wallets = await this.walletService.findByStellarAddress(
      stellarAddressDto,
      req.device._id,
    );
    return response.status(200).json({ wallets });
  }

  @Get('user/')
  async findByUser(@Res() response, @Req() req: any) {
    const wallets = await this.walletService.findWalletByUserId(
      req.CurrentUser._id,
      req.device._id,
    );
    return response.status(200).json({ wallets });
  }

  @Patch(':stellarAddress/assign-user')
  async assignUser(
    @Req() req: any,
    @Res() response,
    @Param() stellarAddressDto: StellarAddressDto,
  ) {
    const wallet = await this.walletService.assignUser(
      stellarAddressDto,
      req.currentUser,
      req.device._id,
    );
    return response.status(200).json({ wallet });
  }

  @Patch(':stellarAddress/activate-wallet')
  async activateWallet(
    @Req() req: any,
    @Res() response,
    @Param() stellarAddressDto: StellarAddressDto,
  ) {
    const wallet = await this.walletService.activateWallet(
      stellarAddressDto,
      req.device,
    );
    return response.status(200).json({ wallet });
  }
}
