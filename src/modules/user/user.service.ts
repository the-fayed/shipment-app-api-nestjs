import * as crypto from 'crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Admin, Customer, Driver } from '@prisma/client';
import {
  CreateAdminDto,
  CreateCustomerDto,
  CreateDriverDto,
} from './dto/create-user.dto';
import { CloudinaryService } from 'src/shared/cloudinary/cloudinary.service';
import { NodemailerService } from 'src/shared/nodemailer/nodemailer.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TwilioService } from 'src/shared/twilio/twilio.service';
import {
  customerEmailConfirmationTemplate,
  driverEmailConfirmationTemplate,
} from 'src/shared/nodemailer/template/confirm-email';
import {
  customerMobileConfirmationTemplate,
  driverMobileConfirmationTemplate,
} from 'src/shared/twilio/template/confirm-mobile';
import {
  UpdateEmailConfirmedAttar,
  UpdateMobileConfirmedAttar,
} from './user.interfaces';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly nodemailerService: NodemailerService,
    private readonly twilioService: TwilioService,
  ) {}

  public async findUserById(
    type: string,
    id: number,
  ): Promise<Customer | Driver | Admin | null> {
    return await this.prismaService[type].findUnique({ where: { id: id } });
  }

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

  private async sendTokens(
    userEmail: string,
    userMobile: string,
    emailTemplate: Function,
    mobileTemplate: Function,
    emailToken: string,
    mobileToke: string,
  ): Promise<void> {
    await this.nodemailerService.sendEmail(
      userEmail,
      'Email verification',
      emailTemplate(emailToken),
    );
    await this.twilioService.sendSms(mobileTemplate(mobileToke), userMobile);
  }

  private async saveTokens(
    userEmail: string,
    emailToken: string,
    mobileToken: string,
  ): Promise<void> {
    const saveEmailToken = this.prismaService.emailVerificationTokens.create({
      data: { userEmail, token: emailToken },
    });
    const saveMobileToken = this.prismaService.mobileVerificationTokens.create({
      data: { userEmail, token: mobileToken },
    });
    await this.prismaService.$transaction([saveEmailToken, saveMobileToken]);
  }

  private async updateCustomer(
    id: number,
    attars: Partial<Customer>,
  ): Promise<Customer | null> {
    return await this.prismaService.customer.update({
      where: { id: id },
      data: attars,
    });
  }

  private async updateDriver(
    id: number,
    attars: Partial<Driver>,
  ): Promise<Driver | null> {
    return await this.prismaService.driver.update({
      where: { id: id },
      data: attars,
    });
  }

  private async uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    return (await this.cloudinaryService.uploadImage(file)).url;
  }

  private async deleteToken(name: string, token: string): Promise<void> {
    await this.prismaService[name].delete({ where: { token: token } });
  }

  public async createAdmin(body: CreateAdminDto): Promise<Admin | undefined> {
    const isExisted = await this.prismaService.admin.findUnique({
      where: { email: body.email },
    });
    if (isExisted) {
      throw new BadRequestException('Email already in use!');
    }
    return this.prismaService.admin.create({ data: body });
  }

  public async createCustomer(
    body: CreateCustomerDto,
  ): Promise<Customer | undefined> {
    const emailVerificationToken = this.generateVerificationToken();
    const mobileVerificationToken = this.generateVerificationToken();
    const isEmailExisted = await this.getUserByEmail(body.email);
    if (isEmailExisted) {
      throw new BadRequestException('Email already in ues.');
    }
    const isMobileExisted = await this.getUserByMobileNumber(body.mobile);
    if (isMobileExisted) {
      throw new BadRequestException('Mobile number already in use!');
    }
    const customer = await this.prismaService.customer.create({ data: body });
    await this.saveTokens(
      customer?.email,
      emailVerificationToken,
      mobileVerificationToken,
    );
    await this.sendTokens(
      customer?.email,
      customer?.mobile,
      customerEmailConfirmationTemplate,
      customerMobileConfirmationTemplate,
      emailVerificationToken,
      mobileVerificationToken,
    );
    return customer;
  }

  public async findCustomerByEmail(
    email: string,
  ): Promise<Customer | undefined> {
    return await this.prismaService.customer.findUnique({
      where: { email: email },
    });
  }

  public async updateCustomerEmailConfirmedStatus(
    token: string,
  ): Promise<Customer | null> {
    const customerToken =
      await this.prismaService.emailVerificationTokens.findUnique({
        where: { token: token },
      });
    if (!customerToken) {
      throw new BadRequestException('Invalid token!');
    }
    const customer = await this.findCustomerByEmail(customerToken.userEmail);
    if (!customer) {
      throw new BadRequestException('Invalid token');
    }
    const attars: UpdateEmailConfirmedAttar = {
      emailConfirmed: true,
    };
    const updated = await this.updateCustomer(customer?.id, attars);
    await this.deleteToken('emailVerificationTokens', customerToken?.token);
    return updated;
  }

  public async updateCustomerMobileConfirmedStatus(
    token: string,
  ): Promise<Customer | null> {
    const customerToken =
      await this.prismaService.mobileVerificationTokens.findUnique({
        where: { token: token },
      });
    if (!customerToken) {
      throw new BadRequestException('Invalid token!');
    }
    const customer = await this.findCustomerByEmail(customerToken.userEmail);
    if (!customer) {
      throw new BadRequestException('Invalid token');
    }
    const attars: UpdateMobileConfirmedAttar = {
      mobileConfirmed: true,
    };
    const updated = await this.updateCustomer(customer?.id, attars);
    await this.deleteToken('mobileVerificationTokens', customerToken?.token);
    return updated;
  }
  // End of Customer Services

  // Driver Services
  public async createDriver(
    body: CreateDriverDto,
  ): Promise<Driver | undefined> {
    const emailVerificationToken = this.generateVerificationToken();
    const mobileVerificationToken = this.generateVerificationToken();
    const isEmailExisted = await this.getUserByEmail(body.email);
    if (isEmailExisted) {
      throw new BadRequestException('Email already in ues.');
    }
    const isMobileExisted = await this.getUserByMobileNumber(body.mobile);
    if (isMobileExisted) {
      throw new BadRequestException('Mobile number already in use!');
    }
    const nationalId = await this.uploadToCloudinary(body.NID);
    const driveLicense = await this.uploadToCloudinary(body.driveLicense);
    const driver = await this.prismaService.driver.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        mobile: body.mobile,
        password: body.password,
        NID: nationalId,
        driveLicense,
      },
    });
    await this.prismaService.vehicle.create({
      data: {
        driverId: driver?.id,
        plateNum: body.vehiclePlateNum,
        color: body.vehicleColor,
        model: body.vehicleModel,
        year: Number(body.vehicleYear),
      },
    });
    await this.saveTokens(
      driver?.email,
      emailVerificationToken,
      mobileVerificationToken,
    );
    await this.sendTokens(
      driver?.email,
      driver?.mobile,
      driverEmailConfirmationTemplate,
      driverMobileConfirmationTemplate,
      emailVerificationToken,
      mobileVerificationToken,
    );
    return driver;
  }

  public async findDriverByEmail(email: string): Promise<Driver | null> {
    return this.prismaService.driver.findUnique({ where: { email: email } });
  }

  public async updateDriverEmailConfirmedStatus(
    token: string,
  ): Promise<Driver | null> {
    const driverToken =
      await this.prismaService.emailVerificationTokens.findUnique({
        where: { token: token },
      });
    if (!driverToken) {
      throw new BadRequestException('Invalid token!');
    }
    const driver = await this.findDriverByEmail(driverToken.userEmail);
    if (!driver) {
      throw new BadRequestException('Invalid token');
    }
    const attars: UpdateEmailConfirmedAttar = {
      emailConfirmed: true,
    };
    const updated = await this.updateDriver(driver?.id, attars);
    await this.deleteToken('emailVerificationTokens', driverToken?.token);
    return updated;
  }

  public async updateDriverMobileConfirmedStatus(
    token: string,
  ): Promise<Driver | null> {
    const driverToken =
      await this.prismaService.mobileVerificationTokens.findUnique({
        where: { token: token },
      });
    if (!driverToken) {
      throw new BadRequestException('Invalid token!');
    }
    const driver = await this.findDriverByEmail(driverToken.userEmail);
    if (!driver) {
      throw new BadRequestException('Invalid token');
    }
    const attars: UpdateMobileConfirmedAttar = {
      mobileConfirmed: true,
    };
    const updated = await this.updateDriver(driver?.id, attars);
    await this.deleteToken('mobileVerificationTokens', driverToken?.token);
    return updated;
  }
  // End of Driver Services
}
