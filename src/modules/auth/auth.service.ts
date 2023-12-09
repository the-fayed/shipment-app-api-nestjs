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
import { LoginRequestDto } from './dto/login.dto';
import { NodemailerService } from '../../shared/nodemailer/nodemailer.service';
import {
  customerEmailConfirmationTemplate,
  driverEmailConfirmationTemplate,
} from '../../shared/nodemailer/template/confirm-email';
import { TwilioService } from '../../shared/twilio/twilio.service';
import { DriverSignupDto, CustomerSignupDto } from './dto/signup.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CloudinaryService } from 'src/shared/cloudinary/cloudinary.service';
import { Customer, Driver } from '@prisma/client';
import {
  customerMobileConfirmationTemplate,
  driverMobileConfirmationTemplate,
} from 'src/shared/twilio/template/confirm-mobile';

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
  async customerSignup(body: CustomerSignupDto): Promise<string> {
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
      throw error;
    }
  }

  async customerLogin(body: LoginRequestDto): Promise<LoginResponse> {
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
      return { ...customer, access_token: accessToken };
    } catch (error) {
      throw error;
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
      throw error;
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
      throw error;
    }
  }
  // End of Customer auth services

  async driverSignup(
    body: DriverSignupDto,
    nationalId: Express.Multer.File,
    driveLicense: Express.Multer.File,
  ): Promise<string> {
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
      const uploadDriveLicense =
        await this.cloudinaryService.uploadImage(driveLicense);
      const uploadNationalId =
        await this.cloudinaryService.uploadImage(nationalId);
      const driver = await this.prismaService.driver.create({
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          password: body.password,
          mobile: body.mobile,
          driveLicense: uploadDriveLicense.url as string,
          NID: uploadNationalId.url as string,
        },
      });
      const vehicle = this.prismaService.vehicle.create({
        data: {
          driverId: driver?.id,
          model: body.vehicleModel,
          year: Number(body.vehicleYear),
          plateNum: body.vehiclePlateNum,
          color: body.vehicleColor,
        },
      });
      const saveEmailToken = this.prismaService.emailVerificationTokens.create({
        data: { token: emailConfirmationToken, userEmail: driver?.email },
      });
      const saveMobileToken =
        this.prismaService.mobileVerificationTokens.create({
          data: { userEmail: driver?.email, token: mobileConfirmationToken },
        });
      await this.nodemailerService.sendEmail(
        driver?.email,
        'Email Verification',
        driverEmailConfirmationTemplate(emailConfirmationToken),
      );
      await this.twilioService.sendSms(
        driverMobileConfirmationTemplate(mobileConfirmationToken),
        driver?.mobile,
      );
      await this.prismaService.$transaction([
        vehicle,
        saveEmailToken,
        saveMobileToken,
      ]);
      return 'Account created successfully please verify your email address and your mobile number to be approved';
    } catch (error) {
      throw error;
    }
  }
}
