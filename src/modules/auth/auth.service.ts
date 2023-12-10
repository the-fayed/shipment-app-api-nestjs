import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DriverSignupDto, CustomerSignupDto } from './dto/signup.dto';
import { LoginResponse, Payload, SerializedUser } from './auth.interfaces';
import { LoginRequestDto } from './dto/login.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  private generateAccessToken(payload: Payload): string {
    return this.jwtService.sign(payload);
  }

  // Start of Customer auth services
  public async customerSignup(body: CustomerSignupDto): Promise<string> {
    // hashing password pre save
    body.password = await bcrypt.hash(body.password, 12);
    const customer = await this.userService.createCustomer(body);
    if (!customer) {
      throw new InternalServerErrorException(
        'Error while creating your account, please try again later!',
      );
    }
    return 'You signed up successfully, please verify your email and mobile number to be able to login';
  }

  public async customerLogin(body: LoginRequestDto): Promise<LoginResponse> {
    const customer = await this.userService.findCustomerByEmail(body.email);
    if (
      !customer ||
      !(await bcrypt.compare(body.password, customer?.password))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!customer?.emailConfirmed) {
      throw new ForbiddenException(
        'Your email address has not been verified yet, please verify your email address first',
      );
    }
    if (!customer?.mobileConfirmed) {
      throw new ForbiddenException(
        'Your mobile number has not been verified yet, please verify your mobile number first',
      );
    }
    const payload: Payload = {
      type: 'customer',
      sub: { userId: customer?.id },
    };
    const accessToken = this.generateAccessToken(payload);
    return { ...(customer as SerializedUser), access_token: accessToken };
  }

  public async verifyCustomerEmail(token: string): Promise<string> {
    const customer =
      await this.userService.updateCustomerEmailConfirmedStatus(token);
    if (!customer) {
      throw new BadRequestException(
        'Error while verifying your email address, please try again later!',
      );
    }
    return 'Your email address has been verified successfully!';
  }

  public async verifyCustomerMobile(token: string): Promise<string> {
    const customer =
      await this.userService.updateCustomerMobileConfirmedStatus(token);
    if (!customer) {
      throw new BadRequestException(
        'Error while verifying your mobile number, please try again later!',
      );
    }
    return 'Your mobile number has been verified successfully!';
  }
  // End of Customer auth services

  // Driver auth services
  public async driverSignup(
    body: DriverSignupDto,
    nationalId: Express.Multer.File,
    driveLicense: Express.Multer.File,
  ): Promise<string> {
    // hashing password pre save
    body.password = await bcrypt.hash(body.password, 12);
    const driver = await this.userService.createDriver({
      ...body,
      NID: nationalId,
      driveLicense,
    });
    if (!driver) {
      throw new InternalServerErrorException(
        'Error while creating your account, please try again later!',
      );
    }
    return 'Account created successfully please verify your email address and your mobile number to be approved';
  }

  public async driverLogin(body: LoginRequestDto): Promise<LoginResponse> {
    const driver = await this.userService.findDriverByEmail(body.email);
    if (!driver || !(await bcrypt.compare(body.password, driver?.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!driver?.emailConfirmed) {
      throw new ForbiddenException(
        'Your email address has not been verified yet, please verify your email address first',
      );
    }
    if (!driver?.mobileConfirmed) {
      throw new ForbiddenException(
        'Your mobile number has not been verified yet, please verify your mobile number first',
      );
    }
    const payload: Payload = { type: 'driver', sub: { userId: driver?.id } };
    const accessToken = this.generateAccessToken(payload);
    return { ...(driver as SerializedUser), access_token: accessToken };
  }

  public async verifyDriverEmail(token: string): Promise<string> {
    const driver =
      await this.userService.updateCustomerEmailConfirmedStatus(token);
    if (!driver) {
      throw new BadRequestException(
        'Error while verifying your email address, please try again later!',
      );
    }
    return 'Your email address has been verified successfully';
  }

  public async verifyDriverMobile(token: string): Promise<string> {
    const driver =
      await this.userService.updateCustomerMobileConfirmedStatus(token);
    if (!driver) {
      throw new BadRequestException(
        'Error while verifying your mobile number, please try again later!',
      );
    }
    return 'Your mobile number has been verified successfully';
  }
}
