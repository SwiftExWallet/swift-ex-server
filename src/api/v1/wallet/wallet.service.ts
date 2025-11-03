import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { WalletRepository } from './wallet.repository';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/schema/user.schema';
import { Wallet } from './schema/wallet.schema';
import mongoose from 'mongoose';
import { StellarAddressDto } from './dto/stellar-address.dto';
import { WalletAddressDto } from './dto/wallet-address.dto';
import { Device } from '../device/schema/device.schema';
import { ActivatedWalletRepository } from './activated-wallet.repository';
import { ActivatedWallet } from './schema/activated-wallet.schema';
import { StellarService } from '../stellar/stellar.service';
import { FirebaseNotificationService } from '../notification/firebase/notification.service';
import { HttpService } from '../alchemy/http.service';
import { SupportedWalletChain } from 'src/common/enum/chain';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly walletRepo: WalletRepository,
    private readonly activatedWalletRepo: ActivatedWalletRepository,
    private readonly userService: UsersService,
    private readonly stellarService: StellarService,
    private readonly notificationService: FirebaseNotificationService,
    private readonly httpService: HttpService,
  ) {}

  async create(
    createWalletDto: CreateWalletDto,
    device: Device,
  ): Promise<Wallet | null> {
    const { userId } = createWalletDto;
    if (userId) {
      const user: User | null = await this.userService.findOne({ _id: userId });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      createWalletDto = Object.assign(createWalletDto, { userId });
    }

    const wallet: Wallet = await this.walletRepo.create(
      Object.assign(createWalletDto, {
        deviceId: device._id,
      }),
    );
    await this.addWalletToListener(wallet);

    return this.walletRepo.findOne({ _id: wallet._id });
  }

  async addWalletToListener(wallet: Wallet) {
    const headers = {
      Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    };
    return this.httpService.put(
      process.env.LISTENER_API_URL as string,
      wallet,
      headers,
    );
  }

  async findWalletByUserId(
    userId: mongoose.Schema.Types.ObjectId,
    deviceId: mongoose.Schema.Types.ObjectId,
  ): Promise<Wallet[] | null> {
    return this.walletRepo.find({ userId, deviceId });
  }

  async findByStellarAddress(
    stellarAddressDto: StellarAddressDto,
    deviceId: mongoose.Schema.Types.ObjectId,
  ): Promise<Wallet[] | null> {
    const { stellarAddress } = stellarAddressDto;

    return this.walletRepo.find({ stellarAddress, deviceId });
  }

  async findByWalletAddress(
    walletAddressDto: WalletAddressDto,
    deviceId: mongoose.Schema.Types.ObjectId,
  ): Promise<Wallet[] | null> {
    const { walletAddress, chain } = walletAddressDto;
    const key = `addresses.${SupportedWalletChain[chain]}`;
    console.log(key);
    return this.walletRepo.find({ [key]: walletAddress, deviceId });
  }

  async findByMultiChainAddressWithoutDevice(
    walletAddressDto: WalletAddressDto,
  ): Promise<Wallet | null> {
    const { walletAddress } = walletAddressDto;
    return this.walletRepo.findOne({ multiChainAddress: walletAddress });
  }

  async assignUser(
    stellarAddressDto: StellarAddressDto,
    user: User,
    deviceId: mongoose.Schema.Types.ObjectId,
  ): Promise<Wallet | null> {
    const { stellarAddress } = stellarAddressDto;
    let wallet: Wallet | null = await this.walletRepo.findOne({
      stellarAddress,
      deviceId,
    });
    if (!wallet) {
      this.logger.log('===Stellar wallet not found===');
      throw new BadRequestException('Wallet not found');
    }
    // check whether address already exist with user
    let userWallet: Wallet | null = await this.walletRepo.findOne({
      stellarAddress,
      userId: user._id,
    });
    if (!userWallet) {
      // if wallet does not exist then assign current user
      return this.walletRepo.assignUser(wallet._id, user._id);
    }
    // if wallet exist then delete the current wallet
    return this.walletRepo.delete(wallet._id);
  }

  async activateWallet(stellarAddressDto: StellarAddressDto, device: Device) {
    const { stellarAddress } = stellarAddressDto;
    this.logger.log('=== stellarAddress', stellarAddress);
    let activatedWallet: ActivatedWallet | null =
      await this.activatedWalletRepo.findOne({
        stellarAddress,
      });
    if (activatedWallet) {
      this.logger.log('wallet is already activated', { stellarAddress });
      throw new BadRequestException(`${stellarAddress} is already activated`);
    }

    activatedWallet = await this.activatedWalletRepo.findOne({
      deviceId: device._id,
    });
    if (activatedWallet) {
      this.logger.log('wallet is already activated on this device', {
        id: device._id,
      });

      throw new BadRequestException(
        `Another address is already activated on this device`,
      );
    }
    const wallet: Wallet | null = await this.walletRepo.findOne({
      stellarAddress,
      deviceId: device._id,
    });
    if (!wallet) {
      throw new NotFoundException(`Wallet not found`);
    }
    this.logger.log('==== preparing transaction to send XLM to wallet==');
    const xdr =
      await this.stellarService.activateWalletBySendingXlm(stellarAddress);

    await this.notificationService.sendNotification(device.fcmToken, {
      title: 'Activate',
      body: `Congratulations! ${process.env.STELLAR_AMOUNT} XLM has been successfully added to your wallet.`,
    });

    return xdr;
  }

  // private async updateThirdPartyWebhookServices(
  //   wallet: Wallet,
  //   device: Device,
  // ) {
  //   this.logger.log('==== updating sorbon hooks ===', {
  //     stellarAddress: wallet.stellarAddress,
  //   });
  //   // updating sorobon hooks (stellar)
  //   this.watcherService.addWalletToSorobon(
  //     wallet.stellarAddress,
  //     device.fcmToken,
  //   );

  //   // updating moralis (multichain)
  //   this.logger.log('==== updating moralis ===', {
  //     multiChainAddress: wallet.multiChainAddress,
  //   });
  //   const { newStream, stream } = await this.watcherService.addWalletToMoralis(
  //     wallet,
  //     device.fcmToken,
  //   );
  //   if (newStream) {
  //     this.logger.log('new stream', { newStream, stream });

  //     const parsedStreamId = typeof stream === 'string' ? stream : stream.id;
  //     this.logger.log('stream', { stream });

  //     return this.walletRepo.updateStreamId(wallet?._id, parsedStreamId);
  //   }
  // }
}
