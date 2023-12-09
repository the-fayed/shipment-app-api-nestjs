import {
  IsAlpha,
  IsEmail,
  IsMobilePhone,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsStrongPassword,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Expose, Transform } from 'class-transformer';

export class CustomerSignupDto {
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

export class DriverSignupDto {
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

  @IsNotEmpty()
  @IsString()
  vehicleModel: string;

  @IsNumber()
  @Min(1930)
  @Max(new Date().getFullYear())
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  vehicleYear: number;

  @IsString()
  @IsNotEmpty()
  vehicleColor: string;

  @IsString()
  @IsNotEmpty()
  vehiclePlateNum: string;
}

export class SignupDto {
  @Expose()
  message: string;
}
