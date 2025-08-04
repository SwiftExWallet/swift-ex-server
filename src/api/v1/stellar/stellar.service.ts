import { Injectable } from '@nestjs/common';
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
  async sendXlm(stellarAddress: string) {
    const sourceKeypair = Keypair.fromSecret(
      process.env.ACTIVATE_STELLAR_ADDRESS as string,
    );
    const sourceAccount = await this.server.loadAccount(
      sourceKeypair.publicKey(),
    );

    const asset = this.server.Asset('USDC', process.env.STELLAR_ONE_TAP_ISSUER);

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: await this.server.fetchBaseFee(),
      networkPassphrase: this.network,
    })
      .addOperation(
        Operation.payment({
          destination: stellarAddress,
          asset: Asset.native(),
          amount: process.env.STELLAR_AMOUNT as string | '10',
        }),
      )
      .addOperation(
        Operation.changeTrust({
          asset: asset,
          limit: '1000',
          source: stellarAddress,
        }),
      )
      .setTimeout(Number(process.env.ACTIVATE_WALLET_TIMEOUT as string))
      .build();

    transaction.sign(sourceKeypair);
    const xdr = transaction.toEnvelope().toXDR('base64');
    // await this.server.submitTransaction(transaction);
    return { xdr };
  }
}
