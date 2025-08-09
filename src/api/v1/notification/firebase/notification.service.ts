import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { NotificationDto } from '../dto/notification.dto';
import * as firebaseAccount from './firebaseServiceAccount.json';
import { Device } from '../../device/schema/device.schema';
@Injectable()
export class FirebaseNotificationService {
  onModuleInit() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          firebaseAccount as admin.ServiceAccount,
        ),
      });
    }
  }

  async sendNotification(
    token: string,
    payload: NotificationDto,
  ): Promise<string> {
    try {
      const { title, body, data } = payload;
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: title,
          body: body,
        },
        data: data || {},
      };
      const response = await admin.messaging().send(message);
      return response;
    } catch (error) {
      console.error('Error sending FCM notification:', error);
      throw new Error('Failed to send notification');
    }
  }

  async sendNotificationFromApp(payload: NotificationDto, device: Device) {
    const token: string = device.fcmToken;
    try {
      const { title, body, data } = payload;
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: title,
          body: body,
        },
        data: data || {},
      };
      const response = await admin.messaging().send(message);
      return response;
    } catch (error) {
      console.error('Error sending FCM notification:', error);
      throw new Error('Failed to send notification');
    }
  }
}
