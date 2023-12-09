import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginResponse } from './types/types';
import { Serialize } from '../../common/decorators/serialize.decorator';
import { CreateCustomerDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/customer/signup')
  @Serialize(SignupDto)
  async customerSignup(@Body() body: CreateCustomerDto): Promise<SignupDto> {
    const result = await this.authService.customerSignup(body);
    if (!result) {
      throw new InternalServerErrorException(
        'Error while signing up, please try again later.',
      );
    }
    return { message: result };
  }

  @Post('/customer/login')
  async customerLogin(@Body() code: LoginDto): Promise<LoginResponse> {
    const result = await this.authService.customerLogin(code);
    if (!result.user || !result.access_token) {
      throw new InternalServerErrorException(
        'Error while logging you in, please try again later!',
      );
    }
    return result;
  }

  @Get('/verify/customer-email/:token')
  async verifyEmail(@Param('token') token: string): Promise<SignupDto> {
    const result = await this.authService.verifyCustomerEmail(token);
    return { message: result };
  }

  @Get('/verify/customer-mobile/:token')
  async verifyMobile(@Param('token') token: string): Promise<SignupDto> {
    const result = await this.authService.verifyCustomerMobile(token);
    return { message: result };
  }
}
