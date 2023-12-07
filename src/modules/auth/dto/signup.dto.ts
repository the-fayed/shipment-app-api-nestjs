import { Expose } from 'class-transformer';

export class SignupDto {
  @Expose()
  message: string;
}
