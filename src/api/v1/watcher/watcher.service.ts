import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { AxiosHeaders } from 'axios';
import * as crypto from 'crypto';
import Moralis from 'moralis';
import { AlchemyMethod } from '../../../common/enum/alchemy.enum';
import { HttpService } from '../alchemy/http.service';
import { Wallet } from '../wallet/schema/wallet.schema';

@Injectable()
export class WatcherService implements OnModuleInit {
  private readonly logger = new Logger(WatcherService.name);

  constructor(private readonly httpService: HttpService) {}

  async onModuleInit() {
    await Moralis.start({
      apiKey: process.env.MORALIS_API_KEY,
    });
  }

  async addWalletToSorobon(
    stellarAddress: string,
    fcmToken: string,
  ): Promise<any> {
    try {
      const encrypted = await this.encryptMessageToString(fcmToken);
      let data = {
        webhook_url: process.env.SOROBON_NOTIFICATION_WEBHOOK,
        chainType: process.env.SOROBAN_HOOKS_API_TYPE,
        walletAddress: stellarAddress,
        additionalData: encrypted,
      };
      const headers = new AxiosHeaders();
      headers.set('x-api-key', process.env.SOROBAN_HOOKS_API_KEY as string);
      headers.set('Content-Type', 'application/json');
      this.logger.log('==== data, header ===', { data, headers });
      const response = await this.httpService.request({
        body: data,
        method: AlchemyMethod.POST,
        url: process.env.SOROBON_WALLET_WATCH_URL as string,
        headers,
      });
      this.logger.log('===== response ==', { response });
      return response;
    } catch (error: any) {
      this.logger.error('====== error ===', { error: error.message });
    }
  }

  async addWalletToMoralis(wallet: Wallet, fcmToken: string): Promise<any> {
    const ERC20TransferABI = [
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'from',
            type: 'address',
          },
          {
            indexed: true,
            name: 'to',
            type: 'address',
          },
          {
            indexed: false,
            name: 'value',
            type: 'uint256',
          },
        ],
        name: 'Transfer',
        type: 'event',
      },
    ];

    if (!wallet.streamId) {
      this.logger.log('=== streamId not available===');

      console.log('====fcm token ===', fcmToken);
      // creating new stream
      const encrypted = await this.encryptMessageToString(
        `${fcmToken}_break_${wallet.multiChainAddress.substring(2, 7)}`,
      );
      this.logger.log('=== encrypted ===', { encrypted });

      this.logger.log('=== creating a stream ===');

      const stream = await Moralis.Streams.add({
        webhookUrl: process.env.MORALIS_NOTIFICATION_WEBHOOK as string,
        description: 'user wallet',
        tag: encrypted,
        chains: ['0xaa36a7', '0x61'], // Sepolia & BSC testnet
        includeNativeTxs: true,
        includeContractLogs: true,
        topic0: [process.env.ERC20_TRANSFER_TOPIC!],
        abi: ERC20TransferABI,
        allAddresses: false,
      });

      this.logger.log('=== stream ===', { stream });

      await Moralis.Streams.addAddress({
        id: stream.toJSON().id,
        address: [wallet.multiChainAddress],
      });
      return {
        newStream: false,
        stream,
      };
    } else {
      this.logger.log(' === streamId available ==');
      const stream = await Moralis.Streams.getAddresses({
        limit: 10,
        id: wallet.streamId,
      });
      if (!stream || !stream.raw || stream.raw.total === 0) {
        this.logger.error('No addresses found in this stream');
        throw new NotFoundException('No addresses found in this stream');
      }
      await Moralis.Streams.deleteAddress({
        id: wallet.streamId,
        address: stream.raw.result[0].address,
      });
      this.logger.log('=== address deleted from stream ===');

      await Moralis.Streams.addAddress({
        id: wallet.streamId,
        address: [wallet.multiChainAddress],
      });
      this.logger.log('=== address added to stream ===');

      return {
        newStream: false,
      };
    }
  }

  async getSecretKey() {
    const base64Key = process.env.NOTIFICATION_ENCRYPT_KEY;
    if (!base64Key) throw new Error('key not found');
    const keyBuffer = Buffer.from(base64Key, 'base64');
    if (keyBuffer.length !== 32)
      throw new Error('invalid key must be 32 bytes');
    return keyBuffer;
  }

  async encryptMessageToString(payload) {
    const secretKey = await this.getSecretKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', secretKey, iv);

    const encrypted = Buffer.concat([
      cipher.update(payload, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // new short method
    const packed = Buffer.concat([iv, encrypted, authTag]);
    return Buffer.from(packed).toString('base64');
  }
}
