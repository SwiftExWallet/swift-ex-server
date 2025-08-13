import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { SendOtpDto } from './dto/send-otp.dto';
import { AuthOtp } from './schema/auth-otp.schema';
@Injectable()
export class AuthOtpRepository {
  constructor(
    @InjectModel(AuthOtp.name)
    private authOtpModel: Model<AuthOtp>,
  ) {}

  async create(
    sendOtpDto: SendOtpDto,
    otp: number,
    session?: mongoose.ClientSession,
  ): Promise<AuthOtp> {
    const createdAuthOtp = new this.authOtpModel({ ...sendOtpDto, otp });
    if (session) {
      return createdAuthOtp.save({ session });
    }
    return createdAuthOtp.save();
  }

  async findOne(cond: Record<string, any>): Promise<AuthOtp | null> {
    return await this.authOtpModel.findOne(cond).sort({ createdAt: -1 });
  }

  delete(_id: mongoose.Schema.Types.ObjectId): Promise<AuthOtp | null> {
    return this.authOtpModel.findByIdAndDelete({ _id });
  }
}
