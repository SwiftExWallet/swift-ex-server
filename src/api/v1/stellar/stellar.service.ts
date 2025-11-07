import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { Injectable, Logger } from '@nestjs/common';
import {
  Networks,
  Keypair,
  TransactionBuilder,
  Operation,
  Asset,
} from '@stellar/stellar-sdk';
import * as StellarSdk from '@stellar/stellar-sdk';

@Injectable()
export class StellarService {
  private readonly logger = new Logger(StellarService.name);

  private server;
  private network: Networks;
  constructor() {
    if (process.env.ENVIRONMENT == 'dev') {
      this.network = Networks.TESTNET;
    } else {
      this.network = Networks.PUBLIC;
    }
    this.server = new StellarSdk.Horizon.Server(
      process.env.RPC_STELLAR as string,
    );
  }

  async activateWalletBySendingXlm(stellarAddress: string) {
    const activateStellarAddress =
      process.env.ENVIRONMENT == 'prod'
        ? await this.getStellarAddress()
        : process.env.ACTIVATE_STELLAR_ADDRESS;

    const sourceKeypair = Keypair.fromSecret(activateStellarAddress);

    const sourceAccount = await this.server.loadAccount(
      sourceKeypair.publicKey(),
    );

    this.logger.log('===== getting asset ====');
    const USDC = new StellarSdk.Asset(
      'USDC',
      process.env.STELLAR_USDC_ADDRESS as string,
    );

    this.logger.log('===== building  transaction ====');

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: await this.server.fetchBaseFee(),
      networkPassphrase: this.network,
    })
      .addOperation(
        Operation.payment({
          destination: stellarAddress,
          asset: Asset.native(),
          amount: process.env.STELLAR_AMOUNT as string,
        }),
      )
      .addOperation(
        Operation.changeTrust({
          asset: USDC,
          limit: process.env.STELLAR_USDC_TRUST_LIMIT as string,
          source: stellarAddress,
        }),
      )
      .setTimeout(Number(process.env.ACTIVATE_WALLET_TIMEOUT as string))
      .build();

    transaction.sign(sourceKeypair);
    const xdr = transaction.toEnvelope().toXDR('base64');
    return { xdr };
  }

  async getStellarAddress() {
    const secretManger = new SecretsManagerClient({
      region: process.env.AWS_REGION,
    });

    const command = new GetSecretValueCommand({
      SecretId: process.env.SECRET_ID_NAME,
    });
    const response = await secretManger.send(command);
    if (!response.SecretString) {
      throw new Error('Invalid secret name');
    }

    const secret = JSON.parse(response.SecretString);
    return secret.STELLAR_ADDRESS;
  }
}
