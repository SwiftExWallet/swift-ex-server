import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { AddressesDto, CreateWalletDto } from './dto/create-wallet.dto';
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
    const wallet = await this.walletService.create(createWalletDto, req.device);
    response.status(201).json({ wallet });
  }

  @Delete('/delete')
  async delete(
    @Req() req: any,
    @Res() response,
    @Body() createWalletDto: CreateWalletDto,
  ) {
    const wallet = await this.walletService.removeWalletToListener(
      {
        ...createWalletDto,
        addresses:
          this.getHeaderWalletAddresses(req) ?? createWalletDto.addresses,
      },
      req.device._id,
    );
    response.status(201).json({ wallet });
  }

  @Get('/:chain/address/:walletAddress')
  async findByMultiChainAddress(
    @Req() req: any,
    @Res() response,
    @Param() walletAddressDto: WalletAddressDto,
  ) {
    const lookupDto = {
      ...walletAddressDto,
      walletAddress: req.walletAddress ?? walletAddressDto.walletAddress,
    };
    const wallets = await this.walletService.findByWalletAddress(
      lookupDto,
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
    const lookupDto = {
      ...stellarAddressDto,
      stellarAddress: req.walletAddress ?? stellarAddressDto.stellarAddress,
    };
    const wallets = await this.walletService.findByStellarAddress(
      lookupDto,
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
    const assignDto = {
      ...stellarAddressDto,
      stellarAddress: req.walletAddress ?? stellarAddressDto.stellarAddress,
    };
    const wallet = await this.walletService.assignUser(
      assignDto,
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
    const activationDto = {
      ...stellarAddressDto,
      stellarAddress: req.walletAddress ?? stellarAddressDto.stellarAddress,
    };
    const wallet = await this.walletService.activateWallet(
      activationDto,
      req.device,
    );
    return response.status(200).json({ wallet });
  }

  private getHeaderWalletAddresses(req: any): AddressesDto | null {
    if (!req.walletAddress || !req.walletChain) {
      return null;
    }

    return {
      [req.walletChain]: req.walletAddress,
    } as AddressesDto;
  }
}
