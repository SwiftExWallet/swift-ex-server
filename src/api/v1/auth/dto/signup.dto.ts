import { IsEmail, IsNotEmpty, MaxLength, MinLength, Matches, IsOptional } from 'class-validator';

export class SignupDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100, { message: 'Email must not exceed 100 characters' })
  email: string;

  @IsOptional()
  @MinLength(5, { message: 'Password too short' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])^[A-Za-z\d@$!%*?&]+$/, {
    message: 'Use format like: Ab1@00'
  })
  password: string;
}
