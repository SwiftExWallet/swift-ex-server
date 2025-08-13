import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema()
export class AuthOtp {
  _id: mongoose.Schema.Types.ObjectId;

  @Prop()
  email: string;

  @Prop()
  otp: number;

  @Prop({
    type: Date,
    default: () => new Date(),
    index: { expireAfterSeconds: 600 },
  })
  createdAt: Date;
}

export const AuthOtpSchema = SchemaFactory.createForClass(AuthOtp);
