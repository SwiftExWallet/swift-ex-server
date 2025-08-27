import 'reflect-metadata';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  oldPassword: string;

  @IsNotEmpty()
  newPassword: string;
}
