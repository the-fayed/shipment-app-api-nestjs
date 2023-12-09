import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { NodemailerModule } from '../../shared/nodemailer/nodemailer.module';
import { TwilioModule } from '../../shared/twilio/twilio.module';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { CloudinaryModule } from 'src/shared/cloudinary/cloudinary.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule,
    CloudinaryModule,
    NodemailerModule,
    TwilioModule,
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
