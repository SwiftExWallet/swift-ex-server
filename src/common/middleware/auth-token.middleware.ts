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
import { UsersService } from 'src/api/v1/users/users.service';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthTokenMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}

  async use(req: any, res: Response, next: NextFunction): Promise<any> {
    Logger.log('==== middleware called ===');
    const route = req.originalUrl;
    console.log('==== route', route);
    if (!req.headers['authorization']) {
      throw new NotFoundException('Token  not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const decodedToken: any = this.jwtService.decode(
      req.headers['authorization'].replace('Bearer ', ''),
    );

    if (!decodedToken) {
      throw new HttpException('Invalid token', HttpStatus.FORBIDDEN);
    }
    const user = await this.userService.findOne({
      _id: decodedToken._id,
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
