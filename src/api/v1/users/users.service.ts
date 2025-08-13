import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from './schema/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly userRepo: UserRepository) {}

  async createUser(createUserDto: CreateUserDto): Promise<User | null> {
    const { password } = createUserDto;
    return this.userRepo.create(
      Object.assign(createUserDto, {
        password: bcrypt.hashSync(
          password,
          bcrypt.genSaltSync(+(process.env.PASSWORD_SALT_ROUNDS ?? '10')),
        ),
      }),
    );
  }

  async updateUser(
    user: User,
    updateUserDto: UpdateUserDto,
  ): Promise<User | null> {
    const { phoneNumber } = updateUserDto;
    this.logger.log('=== updateUser phoneNumber==', { phoneNumber });
    if (phoneNumber && user.phoneNumber !== phoneNumber) {
      let userByPhone: User | null = await this.userRepo.findOne({
        phoneNumber,
      });
      if (userByPhone) {
        throw new BadRequestException(
          `User already exist with phone number ${phoneNumber}`,
        );
      }
    }
    return this.userRepo.update(
      user._id,
      Object.assign(user, { ...updateUserDto }),
    );
  }

  async setUserAttribute(_id: mongoose.Schema.Types.ObjectId, object: any) {
    return this.userRepo.setUserAttribute(_id, object);
  }

  findOne(cond: any): Promise<User | null> {
    return this.userRepo.findOne(cond);
  }

  findUserWithPassword(cond: any): Promise<User | null> {
    return this.userRepo.findOne(cond);
  }

  async validateUser(email: string, password: string): Promise<any | null> {
    const user: User | null = await this.userRepo.findOneWithPassword({
      email,
    });
    console.log(user);
    if (
      user &&
      user.password != null &&
      bcrypt.compareSync(password, user.password)
    ) {
      return this.findOne({ email });
    }
    return null;
  }

  async changePassword(
    changePasswordDto: ChangePasswordDto,
    currentUser: User,
  ): Promise<void> {
    const { oldPassword, newPassword } = changePasswordDto;
    const user: User | null = await this.userRepo.findOneWithPassword({
      _id: currentUser._id,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const isPasswordValid = await bcrypt.compareSync(
      oldPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid old Password');
    }

    await this.updatePassword(user._id, newPassword);
  }

  async updatePassword(_id: mongoose.Schema.Types.ObjectId, password: string) {
    await this.setUserAttribute(_id, {
      password: bcrypt.hashSync(
        password,
        bcrypt.genSaltSync(+(process.env.PASSWORD_SALT_ROUNDS ?? '10')),
      ),
    });
  }
}
