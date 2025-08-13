import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthGuard } from '@nestjs/passport';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('api/v1/auth/')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Res() res, @Body() signupDto: SignupDto) {
    await this.authService.signup(signupDto);
    res.status(201).json({ success: true });
  }

  @Post('login')
  @UseGuards(AuthGuard('local'))
  async login(@Req() req: any, @Res() response) {
    const data = await this.authService.login(req.user);
    response.status(200).json({ ...data });
  }

  @Post('verify-user')
  async verifyOtp(@Res() res: any, @Body() verifyOtpDto: VerifyOtpDto) {
    const data = await this.authService.verifyUser(verifyOtpDto);
    res.status(200).json({ ...data });
  }

  @Post('resend-otp')
  async resendOtp(@Res() res: any, @Body() sendOtpDto: SendOtpDto) {
    await this.authService.resendOtp(sendOtpDto);
    res.status(200).json({ success: true });
  }

  @Post('forgot-password')
  async forgotPassword(@Res() res, @Body() sendOtpDto: SendOtpDto) {
    await this.authService.forgotPassword(sendOtpDto);
    res.status(200).json({ success: true });
  }

  @Post('reset-password')
  async resetPassword(@Res() res, @Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    res.status(200).json({ success: true });
  }
}
