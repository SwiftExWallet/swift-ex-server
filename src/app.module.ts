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
        if (process.env.ENVIRONMENT === 'dev') {
          // 🔹 Gmail Setup
          return {
            transport: {
              host: process.env.EMAIL_HOST,
              port: parseInt(process.env.EMAIL_PORT as string) || 465,
              secure: parseInt(process.env.EMAIL_PORT as string) === 465,
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
              },
            },
            defaults: {
              from: `"SwiftEx Dev" <${process.env.EMAIL_USER}>`,
            },
            template: {
              dir: path.join(__dirname, '/../templates/'),
              adapter: new HandlebarsAdapter(),
              options: { strict: true },
            },
          };
        } else {
          // 🔹 SendGrid SMTP Setup
          return {
            transport: {
              host: 'smtp.sendgrid.net',
              port: 587,
              auth: {
                user: 'apikey', // this literal string is required by SendGrid
                pass: process.env.SENDGRID_API_KEY,
              },
            },
            defaults: {
              from: `"SwiftEx" <process.env.SENDGRID_EMAIL_USER>`,
            },
            template: {
              dir: path.join(__dirname, '/../templates/'),
              adapter: new HandlebarsAdapter(),
              options: { strict: true },
            },
          };
        }
      },
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRE },
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
          path: '/api/v1/auth/signup',
          method: RequestMethod.POST,
        },
        {
          path: '/api/v1/auth/login',
          method: RequestMethod.POST,
        },
        {
          path: '/api/v1/auth/forgot-password',
          method: RequestMethod.POST,
        },
        {
          path: '/api/v1/auth/reset-password',
          method: RequestMethod.POST,
        },
        {
          path: '/api/v1/auth/verify-user',
          method: RequestMethod.POST,
        },
        {
          path: '/api/v1/auth/resend-otp',
          method: RequestMethod.POST,
        },
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
          path: 'api/v1/auth/send-otp',
          method: RequestMethod.POST,
        },
        {
          path: 'api/v1/auth/verify-otp',
          method: RequestMethod.POST,
        },
        {
          path: 'api/v1/alchemy/fetch-quotes',
          method: RequestMethod.POST,
        },
      )
      .forRoutes('*');
  }
}
