import { Module, ValidationPipe } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { NodemailerModule } from './shared/nodemailer/nodemailer.module';
import { CloudinaryModule } from './shared/cloudinary/cloudinary.module';
import { PrismaService } from './shared/prisma/prisma.service';
import { PrismaModule } from './shared/prisma/prisma.module';
import { multerConfig } from './common/config/multer.config';
import { AuthModule } from './modules/auth/auth.module';
import { TwilioModule } from './shared/twilio/twilio.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MulterModule.registerAsync({
      useFactory: () => {
        return multerConfig;
      },
    }),
    AuthModule,
    PrismaModule,
    NodemailerModule,
    CloudinaryModule,
    TwilioModule,
    UserModule,
  ],
  providers: [
    PrismaService,
    { provide: APP_PIPE, useValue: new ValidationPipe() },
  ],
})
export class AppModule {}
