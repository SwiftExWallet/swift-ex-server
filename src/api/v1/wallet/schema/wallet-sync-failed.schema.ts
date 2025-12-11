import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SupportedWalletChain } from 'src/common/enum/chain';

@Schema({ timestamps: true })
export class WalletSyncFailed extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({
    type: Map,
    of: String,
    default: {},
  })
  addresses: Map<SupportedWalletChain, string>;

  @Prop({ default: false })
  isSynced: boolean;

  @Prop()
  syncError: string;
}

export const WalletSyncFailedSchema = SchemaFactory.createForClass(WalletSyncFailed);
