import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { TwilioModule } from '../../shared/twilio/twilio.module';
import { CloudinaryModule } from '../../shared/cloudinary/cloudinary.module';
import { NodemailerModule } from '../../shared/nodemailer/nodemailer.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, NodemailerModule, TwilioModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
