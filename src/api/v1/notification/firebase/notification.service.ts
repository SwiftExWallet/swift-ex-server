import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { NotificationDto } from '../dto/notification.dto';
import { Device } from '../../device/schema/device.schema';

@Injectable()
export class FirebaseNotificationService {
  onModuleInit() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: this.getCredential(),
      });
    }
  }

  private getCredential(): admin.credential.Credential {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    const configuredValues = [projectId, clientEmail, privateKey].filter(
      Boolean,
    ).length;
    if (configuredValues === 0) {
      return admin.credential.applicationDefault();
    }

    if (configuredValues !== 3) {
      throw new Error(
        'FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY must all be set',
      );
    }

    return admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    });
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
