import { Module } from '@nestjs/common';
import { UserQueueService } from 'src/common/user-queue/user-queue.service';
import { BanxaService } from './banxa.service';
import { BanxaController } from './banxa.controller';
import { BanxaHttpService } from './banxa-http.service';
import { BanxaWebhookService } from './banxaWebhook.service';
import { FirebaseNotificationService } from '../notification/firebase/notification.service';
import { DeviceModule } from '../device/device.module';

@Module({
  imports: [
    DeviceModule
  ],
  providers: [
    BanxaService,
    BanxaHttpService,
    UserQueueService,
    BanxaWebhookService,
    FirebaseNotificationService
  ],
  controllers: [
    BanxaController
  ],
})
export class BanxaModule { }
