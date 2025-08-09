import { Injectable, Logger } from '@nestjs/common';
import { Contract, ethers, formatUnits, WebSocketProvider } from 'ethers';
import { FirebaseNotificationService } from '../notification/firebase/notification.service';
import { StellarService } from '../stellar/stellar.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class TransactionListenerService {
  private readonly logger = new Logger(TransactionListenerService.name);

  private provider: WebSocketProvider;
  private contract: Contract;

  private contractABI = [
    'event Transfer(address indexed from, address indexed to, uint256 value)',
  ];

  constructor(
    private readonly walletService: WalletService,
    private readonly notificationService: FirebaseNotificationService,
    private readonly stellarService: StellarService,
  ) {
    this.provider = new ethers.WebSocketProvider(
      process.env.ALCHEMY_PROVIDER_WEBSOCKET as string,
    );
    this.contract = new ethers.Contract(
      process.env.ETH_SMART_CONTRACT as string,
      this.contractABI,
      this.provider,
    );
  }

  onModuleInit() {
    this.listenToEvents();
  }

  private listenToEvents() {
    this.logger.log('Listening for EthReceived events...');

    this.contract.on('Transfer', (from, to, value, event) => {
      this.logger.log(`EthReceived Event:`);
      this.logger.log(`Sender: ${from}`);
      this.logger.log(`Amount: ${formatUnits(value, 6)} USDT} USDT`);
      this.logger.log('-----------------------------------');
      this.findUserByWallet(from, formatUnits(value, 6));
    });
  }

  async findUserByWallet(sender: string, amount: string): Promise<any> {
    const wallet =
      await this.walletService.findByMultiChainAddressWithoutDevice({
        walletAddress: sender,
      });
    if (!wallet) {
      this.logger.log(`Wallet not found`);
      return;
    }
    await this.stellarService.sendXlm(wallet.stellarAddress, amount);
  }
}
