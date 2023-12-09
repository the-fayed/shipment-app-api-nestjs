import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  UploadedFiles,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginResponse,
  SignupResponse,
  VerifyEmailResponse,
  VerifyMobileResponse,
} from './auth.interfaces';
import { Serialize } from '../../common/decorators/serialize.decorator';
import { LoginRequestDto, LoginResponseDto } from './dto/login.dto';
import {
  CustomerSignupDto,
  DriverSignupDto,
  SignupDto,
} from './dto/signup.dto';
import { UploadDriverFiles } from './decorators/upload-file.decorator';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/customer/signup')
  @Serialize(SignupDto)
  async customerSignup(@Body() body: CustomerSignupDto): Promise<SignupDto> {
    const result = await this.authService.customerSignup(body);
    if (!result) {
      throw new InternalServerErrorException(
        'Error while signing up, please try again later.',
      );
    }
    return { message: result };
  }

  @Post('/customer/login')
  @Serialize(LoginResponseDto)
  async customerLogin(@Body() code: LoginRequestDto): Promise<LoginResponse> {
    const result = await this.authService.customerLogin(code);
    return result;
  }

  @Get('/verify/customer-email/:token')
  async verifyEmail(
    @Param('token') token: string,
  ): Promise<VerifyEmailResponse> {
    const result = await this.authService.verifyCustomerEmail(token);
    return { status: 'success', message: result };
  }

  @Get('/verify/customer-mobile/:token')
  async verifyMobile(
    @Param('token') token: string,
  ): Promise<VerifyMobileResponse> {
    const result = await this.authService.verifyCustomerMobile(token);
    return { status: 'success', message: result };
  }

  @Post('/driver/signup')
  @UploadDriverFiles()
  async driverSignup(
    @Body() dto: DriverSignupDto,
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
  ): Promise<SignupResponse> {
    const nationalId = files['nationalId'][0];
    const driveLicense = files['driveLicense'][0];
    const result = await this.authService.driverSignup(
      dto,
      nationalId,
      driveLicense,
    );
    return { status: 'success', message: result };
  }
}
