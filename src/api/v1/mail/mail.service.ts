import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  /**
   * Declare dependencies
   */
  constructor(private readonly mailerService: MailerService) {}

  /**
   * Send mail
   */
  public sendMail(
    to: string,
    subject: string,
    template?: string,
    context?: any,
    attachments?: any,
    cc: string[] = [],
  ): void {
    const message = {
      to: to,
      from: '"Swift Ex" <' + process.env.GMAIL_USER + '>',
      subject: subject,
      cc,
    };
    if (template != '' && context != '') {
      console.log('=== yes template===');
      Object.assign(message, {
        template,
        context: context,
      });
    }
    console.log(JSON.stringify(message));
    if (attachments) {
      Object.assign(message, {
        attachments,
      });
    }

    this.mailerService
      .sendMail(message)
      .then((success) => {
        console.log('Message sent', success);
      })
      .catch((err) => {
        console.log(err);
      });
  }
}
