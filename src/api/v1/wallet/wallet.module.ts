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
import { StellarModule } from '../stellar/stellar.module';
import { NotificationModule } from '../notification/notification.module';
import { AlchemyModule } from '../alchemy/alchemy.module';
import { WalletSyncFailedService } from './wallet-sync-failed.service';
import {
  WalletSyncFailed,
  WalletSyncFailedSchema,
} from './schema/wallet-sync-failed.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: ActivatedWallet.name, schema: ActivatedWalletSchema },
      { name: WalletSyncFailed.name, schema: WalletSyncFailedSchema },
    ]),
    UsersModule,
    StellarModule,
    NotificationModule,
    AlchemyModule,
  ],
  providers: [
    WalletService,
    WalletRepository,
    ActivatedWalletRepository,
    WalletSyncFailedService,
  ],
  exports: [WalletRepository],
  controllers: [WalletController],
})
export class WalletModule {}
