import { IsEmail, IsNotEmpty, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100, { message: 'Email must not exceed 100 characters' })
  email: string;

  @IsNotEmpty()
  otp: number;

  @IsNotEmpty()
  @MinLength(5, { message: 'Password too short' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])^[A-Za-z\d@$!%*?&]+$/, {
    message: 'Use format like: Ab1@00'
  })
  password: string;
}
