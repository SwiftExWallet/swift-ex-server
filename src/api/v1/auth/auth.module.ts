import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { AuthOtpRepository } from './auth-otp.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthOtp, AuthOtpSchema } from './schema/auth-otp.schema';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AuthOtp.name, schema: AuthOtpSchema }]),
    UsersModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthOtpRepository],
})
export class AuthModule {}
