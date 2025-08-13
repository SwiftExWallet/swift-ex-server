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



    const sourceKeypair = Stellar.Keypair.fromSecret(process.env.ACTIVATE_STELLAR_ADDRESS as string);

    const sourceAccount = await this.server.loadAccount(sourceKeypair.publicKey());



    const USDC = new Stellar.Asset('USDC', process.env.STELLAR_USDC_ADDRESS as string);



    this.logger.log('===== Building payment + trustline transaction =====');



    const transaction = new Stellar.TransactionBuilder(sourceAccount, {

      fee: Stellar.BASE_FEE,

      networkPassphrase: Stellar.Networks.TESTNET

    })

      // .addOperation(

      //   Stellar.Operation.payment({

      //     destination: stellarAddress,

      //     asset: Asset.native(),

      //     amount: process.env.STELLAR_AMOUNT || '10',

      //   }),

      // )

      // .addOperation(

      //   Operation.changeTrust({

      //     asset: USDC,

      //     limit: '1000',

      //     source: stellarAddress,

      //   }),

      // )


      .addOperation(Stellar.Operation.createAccount({
        destination: stellarAddress,
        startingBalance: '5'
      }))
      .addOperation(
        Stellar.Operation.changeTrust({
          asset: USDC,
          limit: "1000",
          source: stellarAddress,
        })
      )

      .setTimeout(Number(process.env.ACTIVATE_WALLET_TIMEOUT) || 180)

      .build();



    transaction.sign(sourceKeypair);



    const xdr = transaction.toEnvelope().toXDR('base64');



    return { xdr };

  }

}

