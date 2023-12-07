import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async createCustomer(body: CreateCustomerDto): Promise<Customer | undefined> {
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
    return this.prisma.customer.create({
      data: body,
    });
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

  async updateCustomer(
    id: number,
    attrs: Partial<Customer>,
  ): Promise<Customer | null> {
    const user = await this.getCustomerById(id);
    if (!user) {
      throw new NotFoundException('User not found!');
    }
    Object.assign(user, attrs);
    return this.prisma.customer.update({ where: { id: user?.id }, data: user });
  }

  async findCustomerByEmail(email: string): Promise<Customer | undefined> {
    return await this.prisma.customer.findUnique({ where: { email: email } });
  }

  async deleteCustomerByEmail(email: string): Promise<void> {
    await this.prisma.customer.delete({ where: { email: email } });
  }
}
