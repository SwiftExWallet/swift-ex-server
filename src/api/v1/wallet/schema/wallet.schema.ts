import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { SupportedWalletChain } from '../../../../common/enum/chain';

@Schema({ timestamps: true })
export class Wallet {
  _id: mongoose.Schema.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSchema',
    required: false,
  })
  userId: mongoose.Schema.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeviceSchema',
    required: false,
  })
  deviceId: mongoose.Schema.Types.ObjectId;

  @Prop({
    type: Map,
    of: String, // each chain name → address
    default: {},
  })
  addresses: Map<SupportedWalletChain, string>;

  @Prop({ type: Boolean, default: false })
  isPrimary: boolean;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
