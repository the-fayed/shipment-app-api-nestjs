import { Injectable } from '@nestjs/common';
import * as Twilio from 'twilio';

@Injectable()
export class TwilioService {
  private readonly twilio: Twilio.Twilio;

  constructor() {
    this.twilio = new Twilio.Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  async sendSms(body: string, to: string): Promise<void> {
    try {
      await this.twilio.messages.create({
        body: body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to,
      });
      console.log(`message sent to ${to}`);
    } catch (error) {
      console.error(error);
    }
  }
}
