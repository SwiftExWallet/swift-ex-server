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
import { WatcherService } from '../watcher/watcher.service';
import { StellarService } from '../stellar/stellar.service';
import { FirebaseNotificationService } from '../notification/firebase/notification.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly walletRepo: WalletRepository,
    private readonly activatedWalletRepo: ActivatedWalletRepository,
    private readonly userService: UsersService,
    private readonly watcherService: WatcherService,
    private readonly stellarService: StellarService,
    private readonly notificationService: FirebaseNotificationService,
  ) {}

  async create(createWalletDto: CreateWalletDto): Promise<Wallet> {
    const { userId } = createWalletDto;
    if (userId) {
      const user: User | null = await this.userService.findOne({ _id: userId });
      if (!user) {
        throw new NotFoundException('User not found');
      }
    }
    return this.walletRepo.create(createWalletDto);
  }

  async findWalletByUserId(
    userId: mongoose.Schema.Types.ObjectId,
  ): Promise<Wallet[] | null> {
    return this.walletRepo.find({ userId });
  }

  async findByStellarAddress(
    stellarAddressDto: StellarAddressDto,
  ): Promise<Wallet[] | null> {
    const { stellarAddress } = stellarAddressDto;

    return this.walletRepo.find({ stellarAddress });
  }

  async findByMultiChainAddress(
    walletAddressDto: WalletAddressDto,
  ): Promise<Wallet[] | null> {
    const { walletAddress } = walletAddressDto;
    return this.walletRepo.find({ multiChainAddress: walletAddress });
  }

  async assignUser(
    stellarAddressDto: StellarAddressDto,
    user: User,
  ): Promise<Wallet | null> {
    const { stellarAddress } = stellarAddressDto;
    let wallet: Wallet | null = await this.walletRepo.findOne({
      stellarAddress,
    });
    if (!wallet) {
      this.logger.log('===Stellar wallet found===');
      throw new BadRequestException('Wallet not found');
    }
    // check whether address already exist with user
    let userWallet: Wallet | null = await this.walletRepo.findOne({
      stellarAddress,
      userId: user._id,
    });
    if (!userWallet) {
      // if wallet not exist then assign current user
      return this.walletRepo.assignUser(wallet._id, user._id);
    }
    // if wallet exist then delete the current wallet
    return this.walletRepo.delete(wallet._id);
  }

  async activateWallet(
    stellarAddressDto: StellarAddressDto,
    device: Device,
    user: User,
  ) {
    const { stellarAddress } = stellarAddressDto;
    let activatedWallet: ActivatedWallet | null =
      await this.activatedWalletRepo.findOne({
        stellarAddress,
      });
    if (activatedWallet) {
      throw new BadRequestException(`${stellarAddress} is already activated`);
    }

    activatedWallet = await this.activatedWalletRepo.findOne({
      deviceId: device._id,
    });
    if (activatedWallet) {
      throw new BadRequestException(
        `Another address is already activated on this device`,
      );
    }
    await this.stellarService.sendXlm(stellarAddress);
    await this.notificationService.sendNotification(device.fcmToken, {
      title: 'Activate',
      body: `Congratulations! ${process.env.STELLAR_AMOUNT} XLM has been successfully added to your wallet.`,
    });
    const streamId: string = await this.watcherService.addWalletWatcher(
      stellarAddress,
      device.fcmToken,
    );
    await this.userService.updateUser(user, Object.assign(user, { streamId }));
    await this.watcherService.addWalletToMoralis(
      stellarAddress,
      user,
      device.fcmToken,
    );
  }
}
