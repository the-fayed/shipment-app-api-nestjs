import { Expose } from 'class-transformer';

export class AdminDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;
}
