import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { Serialize } from '../../common/decorators/serialize.decorator';
import { CreateAdminDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { AdminDto } from './dto/user.dto';

@Controller('v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Serialize(AdminDto)
  async createAdmin(@Body() body: CreateAdminDto) {
    const user = this.userService.createAdmin(body);
    if (!user) {
      throw new BadRequestException(
        'Error while creating new admin user, please try again later',
      );
    }
    return user;
  }
}
