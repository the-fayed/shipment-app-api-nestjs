import * as crypto from 'crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  CreateCustomerDto,
  CreateDriverDto,
} from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import { LoginResponse, SignupResponse } from './types/types';
import { LoginDto } from './dto/login.dto';
import { NodemailerService } from '../nodemailer/nodemailer.service';
import { customerEmailConfirmationTemplate } from '../nodemailer/template/confirm-email';
import { TwilioService } from '../twilio/twilio.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly nodemailerService: NodemailerService,
    private readonly twilioService: TwilioService,
    private readonly jwtService: JwtService,
  ) {}

  private generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private generateMobileVerificationToken(code: string): string {
    return crypto.createHash('sha256').update(code.toString()).digest('hex');
  }

  // Start of Customer auth services
  async customerSignup(body: CreateCustomerDto): Promise<string> {
    const verifyEmailToken = this.generateEmailVerificationToken();

    const mobileVerificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    const verifyMobileToken = this.generateMobileVerificationToken(
      mobileVerificationCode,
    );
    const user = await this.userService.createCustomer(
      body,
      verifyEmailToken,
      verifyMobileToken,
    );
    if (!user) {
      throw new BadRequestException('Error while sign up, please try again.');
    }
    try {
      await this.nodemailerService.sendEmail(
        user?.email,
        'Email Confirmation',
        customerEmailConfirmationTemplate(verifyEmailToken),
      );
    } catch (error) {
      await this.userService.deleteCustomerByEmail(user?.email);
      console.log('Error while sending email', error);
      throw new Error('Error while sign up, please try again later!');
    }
    try {
      await this.twilioService.sendSms(
        `Thank you for signing up! To complete your registration,
        please click the following link to verify your mobile number: ${process.env.BASEURL}/v1/auth/verify/customer-mobile/${verifyMobileToken}`,
        `+2${user?.mobile}`,
      );
    } catch (error) {
      await this.userService.deleteCustomerByEmail(user?.email);
      console.log('error while sending sms', error);
      throw new Error('Error while sign up, please try again later');
    }
    return 'A confirmation email has been sent to your email, please verify your email to be able to log in';
  }

  async customerLogin(body: LoginDto): Promise<LoginResponse> {
    const user = await this.userService.findCustomerByEmail(body.email);
    if (!user) {
      throw new BadRequestException(
        'Email is not registered on our system try to sign up first!',
      );
    }
    if (!user.emailConfirmed) {
      throw new BadRequestException(
        'Please confirm your email address to continue',
      );
    }
    const isPasswordMatched = await bcrypt.compare(
      body.password,
      user?.password,
    );
    if (!isPasswordMatched) {
      throw new BadRequestException('Invalid email or password');
    }
    const accessToken = this.jwtService.sign({ userId: user?.id });
    return { user: user, access_token: accessToken };
  }

  async verifyCustomerEmail(token: string): Promise<string> {
    const attrs = {
      emailConfirmed: true,
    };
    const customer = await this.userService.updateCustomerEmailVerify(
      token,
      attrs,
    );
    if (!customer) {
      throw new BadRequestException('Invalid token!');
    }
    return `Email verified successfully`;
  }

  async verifyCustomerMobile(token: string): Promise<string> {
    const attars = {
      mobileConfirmed: true,
    };
    const customer = await this.userService.updateCustomerMobileVerify(
      token,
      attars,
    );
    if (!customer) {
      throw new BadRequestException('Invalid verification code!');
    }
    return 'Mobile number verified successfully.';
  }
  // End of Customer auth services

  async driverSignup(body: CreateDriverDto): Promise<SignupResponse> {
    const user = await this.userService.createDriver(body);
    if (!user) {
      throw new BadRequestException('Error while sign up, try again later!');
    }
    const accessToken = this.jwtService.sign({ userId: user?.id });
    return { user, access_token: accessToken };
  }
}
