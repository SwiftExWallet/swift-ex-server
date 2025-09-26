import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { AuthOtpRepository } from './auth-otp.repository';
import { SendOtpDto } from './dto/send-otp.dto';
import { User } from '../users/schema/user.schema';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AuthOtp } from './schema/auth-otp.schema';
import { SignupDto } from './dto/signup.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly authOtpRepository: AuthOtpRepository,
  ) {}

  async signup(signupDto: SignupDto): Promise<void> {
    const { email } = signupDto;
    let user: User | null = await this.userService.findOne({ email });
    if (user) {
      throw new ConflictException([`User already exist with email ${email}`]);
    }
    await this.userService.createUser(signupDto);
    user = await this.userService.findOne({ email });
    if (!user) {
      throw new InternalServerErrorException(
        'Unable to signup user. Please try after sometime!',
      );
    }
    this.sendOtp(user, 'Verify Email');
  }

  async login(user: User) {
    const { _id, email, isEmailVerified } = user;
    if (!isEmailVerified) {
      this.sendOtp(user, 'Verify Email');
      return {
        user,
      };
    }
    const token = this.jwtService.sign({ _id, email });
    return {
      token,
      user,
    };
  }

  async forgotPassword(sendOtpDto: SendOtpDto): Promise<void> {
    const { email } = sendOtpDto;
    const user: User | null = await this.userService.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.sendOtp(user, 'Forgot Password');
  }

  async resetPassword(resetPassword: ResetPasswordDto): Promise<void> {
    const { email, otp, password } = resetPassword;
    const user = await this.verifyOtp({ email, otp });
    await this.userService.updatePassword(user._id, password);
  }

  async resendOtp(sendOtpDto: SendOtpDto): Promise<void> {
    const { email } = sendOtpDto;
    const user: User | null = await this.userService.findOne({ email });
    console.log('===user ===', { user });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    this.sendOtp(user, 'Verify Email');
  }

  async verifyUser(
    verifyOtpDto: VerifyOtpDto,
  ): Promise<{ token: string; user: User }> {
    const user = await this.verifyOtp(verifyOtpDto);
    await this.userService.setUserAttribute(user._id, {
      isEmailVerified: true,
    });
    const token = this.jwtService.sign({ _id: user._id, email: user.email });
    return {
      token,
      user: Object.assign(user, { isEmailVerified: true }),
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<User> {
    const { otp, email } = verifyOtpDto;
    const user: User | null = await this.userService.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const authOtp: AuthOtp | null = await this.authOtpRepository.findOne({
      email,
    });
    if (!authOtp) {
      this.logger.log('==== Otp not found ===');
      throw new BadRequestException('Invalid otp');
    }
    if (authOtp.otp !== otp) {
      this.logger.log('==== Otp did not match ===');
      throw new BadRequestException('Invalid otp');
    }
    return user;
  }

  private generateOtp(): number {
    // Generate a 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000);
  }

  private async sendOtp(user: User, purpose: string) {
    let fullName: string;
    const { email, firstName, lastName } = user;
    if (firstName) {
      fullName = `${firstName} ${lastName}`;
    } else {
      fullName = email;
    }
    const otp = this.generateOtp();
    await this.authOtpRepository.create({ email }, otp);
    this.sendOtpMail(email, fullName, otp, purpose);
  }

  private sendOtpMail(
    email: string,
    fullName: string,
    otp: number,
    purpose: string,
  ) {
    this.mailService.sendMail(
      email,
      'One-Time Passcode Verification',
      'send-otp',
      { fullName, otp, purpose },
    );
  }
}
