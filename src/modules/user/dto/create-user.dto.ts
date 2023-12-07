import {
  IsAlpha,
  IsEmail,
  IsMobilePhone,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  IsUrl,
  Length,
  Matches,
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

  @IsUrl()
  @IsNotEmpty()
  NID: string;

  @IsUrl()
  @IsNotEmpty()
  driveLicense: string;
}
