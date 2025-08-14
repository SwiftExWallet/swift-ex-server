import { Injectable, Logger } from '@nestjs/common';

import * as Stellar from 'stellar-sdk';

@Injectable()
export class StellarService {
  private readonly logger = new Logger(StellarService.name);

  private server;

  constructor() {
    if (process.env.ENVIRONMENT === 'dev') {
      Stellar.Network.useTestNetwork(); // v0.14.0 style
    } else {
      Stellar.Network.usePublicNetwork(); // v0.14.0 style
    }

    this.server = new Stellar.Server(process.env.RPC_STELLAR as string);
  }

  async sendXlm(stellarAddress: string) {
    const sourceKeypair = Stellar.Keypair.fromSecret(
      process.env.ACTIVATE_STELLAR_ADDRESS as string,
    );

    this.logger.log('==== sourceKeypair Prepared ==');
    const sourceAccount = await this.server.loadAccount(
      sourceKeypair.publicKey(),
    );

    this.logger.log('==== source account  loaded ==');

    const USDC = new Stellar.Asset(
      'USDC',
      process.env.STELLAR_USDC_ADDRESS as string,
    );

    this.logger.log('===== Building payment + trust line transaction =====');

    const transaction = new Stellar.TransactionBuilder(sourceAccount, {
      fee: Stellar.BASE_FEE,

      networkPassphrase: Stellar.Networks.TESTNET,
    })
      .addOperation(
        Stellar.Operation.createAccount({
          destination: stellarAddress,
          startingBalance: '5',
        }),
      )
      .addOperation(
        Stellar.Operation.changeTrust({
          asset: USDC,
          limit: '1000',
          source: stellarAddress,
        }),
      )
      .setTimeout(Number(process.env.ACTIVATE_WALLET_TIMEOUT) || 180)
      .build();

    this.logger.log('=====  transaction =====', { transaction });

    transaction.sign(sourceKeypair);

    const xdr = transaction.toEnvelope().toXDR('base64');
    this.logger.log('=====  xdr =====', { xdr });

    return { xdr };
  }
}
