import { Module, ValidationPipe } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { NodemailerModule } from './modules/nodemailer/nodemailer.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { PrismaService } from './modules/prisma/prisma.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { multerConfig } from './common/config/multer.config';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { TwilioModule } from './modules/twilio/twilio.module';

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
    CacheModule.register({ isGlobal: true }),
    UserModule,
    AuthModule,
    PrismaModule,
    NodemailerModule,
    CloudinaryModule,
    TwilioModule,
  ],
  providers: [
    PrismaService,
    { provide: APP_PIPE, useValue: new ValidationPipe() },
  ],
})
export class AppModule {}
