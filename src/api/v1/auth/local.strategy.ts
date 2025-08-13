import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../../../api/v1/users/users.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UsersService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    console.log('==== called ===');
    const user = await this.userService.validateUser(username, password);
    if (!user) {
      throw new BadRequestException('Either email or password is wrong');
    }
    return user;
  }
}
