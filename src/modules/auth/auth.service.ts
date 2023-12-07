import * as crypto from 'crypto';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Customer } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly nodemailerService: NodemailerService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private readonly cacheService: Cache,
  ) {}

  private generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Start of Customer auth services
  async customerSignup(body: CreateCustomerDto): Promise<string> {
    const user = await this.userService.createCustomer(body);
    if (!user) {
      throw new BadRequestException('Error while sign up, please try again.');
    }
    try {
      const verifyEmailToken = this.generateEmailVerificationToken();
      await this.cacheService.set(
        verifyEmailToken,
        `${user?.id}-emailToken`,
        0,
      );
      await this.nodemailerService.sendEmail(
        user?.email,
        'Email Confirmation',
        customerEmailConfirmationTemplate(verifyEmailToken),
      );
      return 'A confirmation email has been sent to your email, please verify your email to be able to log in';
    } catch (error) {
      await this.userService.deleteCustomerByEmail(user?.email);
      console.log('Error while sending email', error);
      throw new Error('Error while sign up, please try again later!');
    }
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
    const user: string = await this.cacheService.get(token);
    const [id, type] = user.split('-');
    if (type === 'emailToken') {
      const attrs: Partial<Customer> = {
        emailConfirmed: true,
      };
      await this.userService.updateCustomer(parseInt(id), attrs);
      return `Email confirmed successfully`;
    } else {
      throw new BadRequestException('Invalid verification token');
    }
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
