import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NodemailerService {
  private transporter: nodemailer.Transporter;
  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('NODEMAILER_HOST'),
      auth: {
        user: this.configService.get<string>('NODEMAILER_USERNAME'),
        pass: this.configService.get<string>('NODEMAILER_PASSWORD'),
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const mailOpts = {
      from: `no-replay ${this.configService.get<string>(
        'NODEMAILER_USERNAME',
      )}`,
      to,
      subject,
      html,
    };
    await this.transporter.sendMail(mailOpts);
  }
}
