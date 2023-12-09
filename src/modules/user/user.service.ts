import { BadRequestException, Injectable } from '@nestjs/common';
import { Admin, Customer, Driver } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAdminDto,
  CreateCustomerDto,
  CreateDriverDto,
} from './dto/create-user.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private async getUserByEmail(
    email: string,
  ): Promise<Customer | Driver | null> {
    return (
      (await this.prisma.driver.findUnique({ where: { email: email } })) ||
      (await this.prisma.customer.findUnique({ where: { email: email } }))
    );
  }

  private async getUserByMobileNumber(
    mobile: string,
  ): Promise<Customer | Driver | null> {
    return (
      (await this.prisma.driver.findUnique({ where: { mobile: mobile } })) ||
      (await this.prisma.customer.findUnique({ where: { mobile: mobile } }))
    );
  }

  private async getCustomerById(id: number): Promise<Customer | null> {
    return await this.prisma.customer.findUnique({ where: { id: id } });
  }

  async createAdmin(body: CreateAdminDto): Promise<Admin | undefined> {
    const isExisted = await this.prisma.admin.findUnique({
      where: { email: body.email },
    });
    if (isExisted) {
      throw new BadRequestException('Email already in use!');
    }
    // hashing password before save
    const hashedPassword = await bcrypt.hash(body.password, 12);
    body.password = hashedPassword;
    return this.prisma.admin.create({ data: body });
  }

  async createCustomer(
    body: CreateCustomerDto,
    emailToken: string,
    mobileToken: string,
  ): Promise<Customer | undefined> {
    const isEmailExisted = await this.getUserByEmail(body.email);
    if (isEmailExisted) {
      throw new BadRequestException('Email already in ues.');
    }
    const isMobileExisted = await this.getUserByMobileNumber(body.mobile);
    if (isMobileExisted) {
      throw new BadRequestException('Mobile number already in use!');
    }
    // hashing password before save
    const hashedPassword = await bcrypt.hash(body.password, 12);
    body.password = hashedPassword;
    // saving email verification token
    const user = await this.prisma.customer.create({ data: body });
    await this.prisma.emailVerificationTokens.create({
      data: { userId: user?.id, token: emailToken },
    });
    await this.prisma.mobileVerificationToken.create({
      data: { userId: user?.id, token: mobileToken },
    });
    return user;
  }

  async createDriver(body: CreateDriverDto): Promise<Driver | undefined> {
    const isEmailExisted = await this.getUserByEmail(body.email);
    if (isEmailExisted) {
      throw new BadRequestException('Email already in ues.');
    }
    const isMobileExisted = await this.getUserByMobileNumber(body.mobile);
    if (isMobileExisted) {
      throw new BadRequestException('Mobile number already in use!');
    }
    // hashing password before save
    const hashedPassword = await bcrypt.hash(body.password, 12);
    body.password = hashedPassword;
    return this.prisma.driver.create({ data: body });
  }

  async updateCustomerEmailVerify(
    token: string,
    attrs: Partial<Customer>,
  ): Promise<Customer | null> {
    const user = await this.prisma.emailVerificationTokens.findFirst({
      where: { token: token },
    });
    const customer = await this.prisma.customer.findUnique({
      where: { id: user?.userId },
    });
    if (!user || !customer) {
      throw new BadRequestException('Invalid token!');
    }
    Object.assign(customer, attrs);
    const deleteToken = this.prisma.emailVerificationTokens.delete({
      where: { token_userId: user },
    });
    const updatedCustomer = this.prisma.customer.update({
      where: { id: customer.id },
      data: attrs,
    });
    await this.prisma.$transaction([updatedCustomer, deleteToken]);
    return customer;
  }

  async updateCustomerMobileVerify(
    token: string,
    attrs: Partial<Customer>,
  ): Promise<Customer | null> {
    const user = await this.prisma.mobileVerificationToken.findFirst({
      where: { token: token },
    });
    if (!user) {
      throw new BadRequestException('Invalid code');
    }
    const customer = await this.prisma.customer.findUnique({
      where: { id: user?.userId },
    });
    if (!customer) {
      throw new BadRequestException('Invalid code');
    }
    Object.assign(customer, attrs);
    const deleteToken = this.prisma.mobileVerificationToken.delete({
      where: { token_userId: user },
    });
    const updateUser = this.prisma.customer.update({
      where: { id: customer?.id },
      data: attrs,
    });
    await this.prisma.$transaction([deleteToken, updateUser]);
    return customer;
  }

  async findCustomerByEmail(email: string): Promise<Customer | undefined> {
    return await this.prisma.customer.findUnique({ where: { email: email } });
  }

  async deleteCustomerByEmail(email: string): Promise<void> {
    await this.prisma.customer.delete({ where: { email: email } });
  }
}
