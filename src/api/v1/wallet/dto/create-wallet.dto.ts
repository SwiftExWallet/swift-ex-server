import { IsNotEmpty, IsOptional } from 'class-validator';
import mongoose from 'mongoose';

export class CreateWalletDto {
  @IsOptional()
  userId: mongoose.Schema.Types.ObjectId;

  @IsNotEmpty()
  multiChainAddress: string;

  @IsNotEmpty()
  stellarAddress: string;

  @IsOptional()
  isPrimary: boolean;
}
