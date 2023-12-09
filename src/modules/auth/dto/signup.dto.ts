import {
  IsAlpha,
  IsEmail,
  IsMobilePhone,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Length,
} from 'class-validator';
import { Expose } from 'class-transformer';

export class SignupCustomerDto {
  @IsString()
  @IsNotEmpty()
  @IsAlpha()
  @Length(3, 32, { message: 'First name must be between 3 to 32 characters.' })
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @IsAlpha()
  @Length(3, 32, { message: 'First name must be between 3 to 32 characters.' })
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsStrongPassword()
  @IsNotEmpty()
  password: string;

  @IsMobilePhone('ar-EG')
  @IsNotEmpty()
  mobile: string;
}

export class SignupDto {
  @Expose()
  message: string;
}
