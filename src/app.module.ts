import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DeviceModule } from './api/v1/device/device.module';
import { UsersModule } from './api/v1/users/users.module';
import { MailerModule } from '@nestjs-modules/mailer';
import * as path from 'path';

import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './api/v1/auth/auth.module';
import { MailModule } from './api/v1/mail/mail.module';
import { AlchemyModule } from './api/v1/alchemy/alchemy.module';
import { WalletModule } from './api/v1/wallet/wallet.module';
import { StellarModule } from './api/v1/stellar/stellar.module';
import { WatcherModule } from './api/v1/watcher/watcher.module';
import { NotificationModule } from './api/v1/notification/notification.module';
import { DeviceAuthTokenMiddleware } from './common/middleware/device-auth-token-middleware';
import { AuthTokenMiddleware } from './common/middleware/auth-token.middleware';
import { google } from 'googleapis';
import { MarketDataModule } from './api/v1/market-data/market-data.module';
import { ScheduleModule } from '@nestjs/schedule';

const OAuth2 = google.auth.OAuth2;

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_CONN_STRING as any, {
      dbName: process.env.DB_NAME,
    }),
    MailerModule.forRootAsync({
      useFactory: async () => {
        const oAuth2Client = new OAuth2(
          process.env.GMAIL_CLIENT_ID,
          process.env.GMAIL_CLIENT_SECRET,
          process.env.GMAIL_REDIRECT_URI,
        );
        oAuth2Client.setCredentials({
          refresh_token: process.env.GMAIL_REFRESH_TOKEN,
        });

        // Get fresh access token before transporter is created
        const accessToken = await oAuth2Client.getAccessToken();

        return {
          transport: {
            service: 'gmail',
            auth: {
              type: 'OAuth2',
              user: process.env.GMAIL_USER,
              clientId: process.env.GMAIL_CLIENT_ID,
              clientSecret: process.env.GMAIL_CLIENT_SECRET,
              refreshToken: process.env.GMAIL_REFRESH_TOKEN,
              accessToken: accessToken.token, // fresh token
            },
          },
          defaults: {
            from: '"SwiftEx" <' + process.env.GMAIL_USER + '>',
          },
          preview: false,
          template: {
            dir: path.join(__dirname, '/../', '/templates/'),
            adapter: new HandlebarsAdapter(), // or new PugAdapter() or new EjsAdapter()
            options: {
              strict: true,
            },
          },
        };
      },
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
      verifyOptions: { ignoreExpiration: false },
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    DeviceModule,
    AuthModule,
    MailModule,
    AlchemyModule,
    WalletModule,
    StellarModule,
    WatcherModule,
    NotificationModule,
    MarketDataModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer
      .apply(DeviceAuthTokenMiddleware)
      .exclude(
        {
          path: '/api/v1/device',
          method: RequestMethod.POST,
        },
        {
          path: '/api/v1/device/:uniqueId/unique-id',
          method: RequestMethod.GET,
        },
      )
      .forRoutes('*');

    consumer
      .apply(AuthTokenMiddleware)
      .exclude(
        {
          path: '/api/v1/device',
          method: RequestMethod.POST,
        },
        {
          path: '/api/v1/market-data',
          method: RequestMethod.GET,
        },
        {
          path: '/api/v1/device/update-fcm-token',
          method: RequestMethod.POST,
        },
        {
          path: '/api/v1/device/update-fcm-token',
          method: RequestMethod.PATCH,
        },
        {
          path: '/api/v1/device/:uniqueId/unique-id',
          method: RequestMethod.GET,
        },
        {
          path: '/api/v1/wallet',
          method: RequestMethod.POST,
        },
        {
          path: '/api/v1/wallet/:walletAddress/multiChain',
          method: RequestMethod.GET,
        },
        {
          path: '/api/v1/wallet/:stellarAddress/stellar',
          method: RequestMethod.GET,
        },
        {
          path: '/api/v1/wallet/:stellarAddress/activate-wallet',
          method: RequestMethod.PATCH,
        },
        {
          path: 'api/v1/alchemy/fetch-quotes',
          method: RequestMethod.POST,
        },
        {
          path: 'api/v1/alchemy/create-buy-order',
          method: RequestMethod.POST,
        },
        {
          path: 'api/v1/alchemy/create-sell-order',
          method: RequestMethod.POST,
        },
      )
      .forRoutes('*');
  }
}
