import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class Wallet {
  _id: mongoose.Schema.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSchema',
    required: false,
  })
  userId: mongoose.Schema.Types.ObjectId;

  @Prop()
  multiChainAddress: string;

  @Prop()
  stellarAddress: string;

  @Prop({ type: Boolean, default: false })
  isPrimary: boolean;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
