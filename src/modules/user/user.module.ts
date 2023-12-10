import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { TwilioModule } from '../../shared/twilio/twilio.module';
import { CloudinaryModule } from '../../shared/cloudinary/cloudinary.module';
import { NodemailerModule } from '../../shared/nodemailer/nodemailer.module';
import { UserController } from './user.controller';

@Module({
  imports: [PrismaModule, CloudinaryModule, NodemailerModule, TwilioModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
