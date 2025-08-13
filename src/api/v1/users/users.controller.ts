import { Body, Controller, Get, Put, Req, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

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
    return response.status(201).json({ user });
  }

  @Put('')
  async changePassword(
    @Req() req: any,
    @Res() response,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.userService.changePassword(changePasswordDto, req.currentUser);
    return response.status(200).json({ success: true });
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
