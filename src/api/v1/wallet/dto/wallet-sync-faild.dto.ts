import { IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { AddressesDto } from "./create-wallet.dto";
import mongoose from "mongoose";

export class MarkSyncFailedDto {
  @IsNotEmpty()
  userId: mongoose.Schema.Types.ObjectId;

  @IsNotEmpty()
  @ValidateNested()
  addresses: AddressesDto;

  @IsNotEmpty()
  @IsString()
  syncError: string;
}