import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../api/v1/users/users.service';
import { Response, NextFunction } from 'express';

@Injectable()
export class AuthTokenMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}

  async use(req: any, res: Response, next: NextFunction): Promise<any> {
    Logger.log('==== middleware called ===');
    const authorization = req.headers['authorization'];
    if (!authorization) {
      throw new NotFoundException('Token  not found');
    }

    if (
      typeof authorization !== 'string' ||
      !authorization.startsWith('Bearer ')
    ) {
      throw new HttpException('Invalid token', HttpStatus.FORBIDDEN);
    }

    const token = authorization.replace('Bearer ', '').trim();
    if (!token) {
      throw new HttpException('Invalid token', HttpStatus.FORBIDDEN);
    }

    let verifiedToken: any;
    try {
      verifiedToken = await this.jwtService.verifyAsync(token);
    } catch {
      throw new HttpException('Invalid token', HttpStatus.FORBIDDEN);
    }

    if (!verifiedToken?._id) {
      throw new HttpException('Invalid token', HttpStatus.FORBIDDEN);
    }

    const user = await this.userService.findOne({
      _id: verifiedToken._id,
    });
    if (!user) {
      throw new HttpException('Invalid token', HttpStatus.FORBIDDEN);
    }
    if (!user.isEmailVerified) {
      throw new ForbiddenException('Please verify user first');
    }
    req.currentUser = user;

    next();
  }
}
