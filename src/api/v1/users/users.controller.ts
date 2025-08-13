import { Body, Controller, Get, Put, Req, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Put('')
  async updateUser(
    @Req() req: any,
    @Res() response,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.userService.updateUser(
      req.currentUser,
      updateUserDto,
    );
    response.status(201).json({ user });
  }

  @Get('/profile')
  async getUser(
    @Req() req: any,
    @Res() response,
  ) {
    const user = await this.userService.findOne(req.currentUser);
    response.status(201).json({ user });
  }
}
