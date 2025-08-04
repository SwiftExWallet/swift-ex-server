import { Injectable, NotFoundException } from '@nestjs/common';
import { Device } from './schema/device.schema';
import { DeviceRepository } from './device.repository';
import mongoose from 'mongoose';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateFcmTokenDto } from './dto/update-fcm-token.dto';
import { User } from '../users/schema/user.schema';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class DeviceService {
  constructor(
    private readonly deviceRepo: DeviceRepository,
    private readonly jwtService: JwtService,
  ) {}

  async create(createDeviceDto: CreateDeviceDto): Promise<string> {
    const { uniqueId, fcmToken } = createDeviceDto;
    let device: Device | null = await this.deviceRepo.findOne({ uniqueId });
    if (device) {
      await this.deviceRepo.updateFcmToken(device._id, fcmToken);
    } else {
      device = await this.deviceRepo.create(createDeviceDto);
    }
    return this.jwtService.sign(JSON.stringify({ _id: device?._id }));
  }

  async updateFcmToken(
    _id: mongoose.Schema.Types.ObjectId,
    updateFcmToken: UpdateFcmTokenDto,
  ): Promise<Device | null> {
    const { fcmToken } = updateFcmToken;
    const device: Device | null = await this.deviceRepo.findOne({ _id });

    if (!device) {
      throw new NotFoundException('Device not found');
    }
    return this.deviceRepo.updateFcmToken(device._id, fcmToken);
  }

  async updateUser(
    _id: mongoose.Schema.Types.ObjectId,
    user: User,
  ): Promise<Device | null> {
    const device: Device | null = await this.deviceRepo.findOne({ _id });

    if (!device) {
      throw new NotFoundException('Device not found');
    }
    return this.deviceRepo.updateUser(device._id, user._id);
  }

  findOne(_id: mongoose.Schema.Types.ObjectId): Promise<Device | null> {
    return this.deviceRepo.findOne({ _id });
  }

  findOneByUniqueId(uniqueId: string): Promise<Device | null> {
    return this.deviceRepo.findOne({ uniqueId });
  }
}
