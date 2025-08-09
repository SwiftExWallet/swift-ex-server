import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletRepository } from './wallet.repository';
import { UsersModule } from '../users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './schema/wallet.schema';
import { ActivatedWalletRepository } from './activated-wallet.repository';
import {
  ActivatedWallet,
  ActivatedWalletSchema,
} from './schema/activated-wallet.schema';
import { WatcherModule } from '../watcher/watcher.module';
import { StellarModule } from '../stellar/stellar.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: ActivatedWallet.name, schema: ActivatedWalletSchema },
    ]),
    UsersModule,
    WatcherModule,
    StellarModule,
    NotificationModule,
  ],
  providers: [WalletService, WalletRepository, ActivatedWalletRepository],
  controllers: [WalletController],
})
export class WalletModule {}
