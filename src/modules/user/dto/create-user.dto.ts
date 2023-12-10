import { Transform } from 'class-transformer';
import {
  IsAlpha,
  IsEmail,
  IsMobilePhone,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsStrongPassword,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateAdminDto {
  @IsString()
  @Length(3, 32, { message: 'Name must be between 3 to 32 characters.' })
  @Matches(/^[a-zA-Z\s]+$/, {
    message: 'Name should only contain letters and spaces.',
  })
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsStrongPassword()
  @IsNotEmpty()
  password: string;
}

export class CreateCustomerDto {
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

  @IsMobilePhone()
  @IsNotEmpty()
  mobile: string;
}

export class CreateDriverDto {
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

  @IsMobilePhone()
  @IsNotEmpty()
  mobile: string;

  @IsNotEmpty()
  NID: Express.Multer.File;

  @IsNotEmpty()
  driveLicense: Express.Multer.File;

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
