import * as crypto from 'crypto';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginResponse, Payload } from './auth.interfaces';
import { LoginDto } from './dto/login.dto';
import { NodemailerService } from '../../shared/nodemailer/nodemailer.service';
import { customerEmailConfirmationTemplate } from '../../shared/nodemailer/template/confirm-email';
import { TwilioService } from '../../shared/twilio/twilio.service';
import { SignupCustomerDto } from './dto/signup.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CloudinaryService } from 'src/shared/cloudinary/cloudinary.service';
import { Customer, Driver } from '@prisma/client';
import { customerMobileConfirmationTemplate } from 'src/shared/twilio/template/confirm-mobile';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly nodemailerService: NodemailerService,
    private readonly twilioService: TwilioService,
    private readonly jwtService: JwtService,
  ) {}
  private async getUserByEmail(
    email: string,
  ): Promise<Customer | Driver | null> {
    return (
      (await this.prismaService.driver.findUnique({
        where: { email: email },
      })) ||
      (await this.prismaService.customer.findUnique({
        where: { email: email },
      }))
    );
  }

  private async getUserByMobileNumber(
    mobile: string,
  ): Promise<Customer | Driver | null> {
    return (
      (await this.prismaService.driver.findUnique({
        where: { mobile: mobile },
      })) ||
      (await this.prismaService.customer.findUnique({
        where: { mobile: mobile },
      }))
    );
  }

  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private generateAccessToken(payload: Payload): string {
    return this.jwtService.sign(payload);
  }

  // Start of Customer auth services
  async customerSignup(body: SignupCustomerDto): Promise<string> {
    try {
      // checking if email in use
      const isEmailInUse = await this.getUserByEmail(body.email);
      if (isEmailInUse) {
        throw new BadRequestException('Email address already in use!');
      }
      // checking if mobile number in use
      const isMobileInUse = await this.getUserByMobileNumber(body.mobile);
      if (isMobileInUse) {
        throw new BadRequestException('Mobile number already in use!');
      }
      // generate mobile, and email confirmation tokens
      const mobileConfirmationToken = this.generateVerificationToken();
      const emailConfirmationToken = this.generateVerificationToken();
      // hashing password pre save
      body.password = await bcrypt.hash(body.password, 12);
      const customer = await this.prismaService.customer.create({ data: body });
      const saveEmailToken = this.prismaService.emailVerificationTokens.create({
        data: { token: emailConfirmationToken, userEmail: customer?.email },
      });
      const saveMobileToken =
        this.prismaService.mobileVerificationTokens.create({
          data: { token: mobileConfirmationToken, userEmail: customer?.email },
        });
      try {
        await this.nodemailerService.sendEmail(
          customer?.email,
          `Email Confirmation`,
          customerEmailConfirmationTemplate(emailConfirmationToken),
        );
        await this.twilioService.sendSms(
          customerMobileConfirmationTemplate(mobileConfirmationToken),
          customer?.mobile,
        );
        await this.prismaService.$transaction([
          saveEmailToken,
          saveMobileToken,
        ]);
      } catch (error) {
        await this.prismaService.customer.delete({
          where: { id: customer?.id },
        });
        throw new InternalServerErrorException(
          'Error while signing you up, please try again later!',
        );
      }
      return 'You signed up successfully, please verify your email and mobile number to be able to login';
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async customerLogin(body: LoginDto): Promise<LoginResponse> {
    try {
      const customer = await this.prismaService.customer.findUnique({
        where: { email: body?.email },
      });
      const isPasswordMatch = await bcrypt.compare(
        body?.password,
        customer?.password,
      );
      if (!customer || !isPasswordMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }
      if (!customer?.emailConfirmed) {
        throw new UnauthorizedException(
          'Please verify your email address first!',
        );
      }
      if (!customer?.mobileConfirmed) {
        throw new UnauthorizedException(
          'Please verify your mobile number first!',
        );
      }
      const accessToken = this.generateAccessToken({ userId: customer?.id });
      return { user: customer, access_token: accessToken };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error while signing you in, please try again later!',
      );
    }
  }

  async verifyCustomerEmail(token: string): Promise<string> {
    try {
      const user = await this.prismaService.emailVerificationTokens.findUnique({
        where: { token: token },
      });
      const customer = await this.prismaService.customer.findUnique({
        where: { email: user?.userEmail },
      });
      if (!user || !customer) {
        throw new BadRequestException('Invalid token');
      }
      const updateCustomer = this.prismaService.customer.update({
        where: { id: customer?.id },
        data: { emailConfirmed: true },
      });
      const deleteToken = this.prismaService.emailVerificationTokens.delete({
        where: { token: user?.token },
      });
      await this.prismaService.$transaction([updateCustomer, deleteToken]);
      return 'Email address confirmed successfully!';
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Error while verifying your email address, please try again later!',
      );
    }
  }

  async verifyCustomerMobile(token: string): Promise<string> {
    try {
      const user = await this.prismaService.mobileVerificationTokens.findUnique(
        {
          where: { token: token },
        },
      );
      const customer = await this.prismaService.customer.findUnique({
        where: { email: user?.userEmail },
      });
      if (!user || !customer) {
        throw new BadRequestException('Invalid token');
      }
      const updateCustomer = this.prismaService.customer.update({
        where: { id: customer?.id },
        data: { mobileConfirmed: true },
      });
      const deleteToken = this.prismaService.mobileVerificationTokens.delete({
        where: { token: user?.token },
      });
      await this.prismaService.$transaction([updateCustomer, deleteToken]);
      return 'Mobile number confirmed successfully!';
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Error while verifying your mobile number, please try again later!',
      );
    }
  }
  // End of Customer auth services
}
