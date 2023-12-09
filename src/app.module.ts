import { Module, ValidationPipe } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { NodemailerModule } from './shared/nodemailer/nodemailer.module';
import { CloudinaryModule } from './shared/cloudinary/cloudinary.module';
import { PrismaService } from './shared/prisma/prisma.service';
import { PrismaModule } from './shared/prisma/prisma.module';
import { multerConfig } from './common/config/multer.config';
import { AuthModule } from './modules/auth/auth.module';
import { TwilioModule } from './shared/twilio/twilio.module';
import { JwtModule } from '@nestjs/jwt';

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
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          global: true,
          secret: configService.get('JWT_SECRET'),
          signOptions: { expiresIn: configService.get('JWT_EXPIRATION') },
        };
      },
    }),
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
