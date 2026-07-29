import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Portfolio, PortfolioSyncStatus, PortfolioToken } from './schema/portfolio.schema';

@Injectable()
export class PortfolioRepository {
  constructor(
    @InjectModel(Portfolio.name) private portfolioModel: Model<Portfolio>,
  ) {}

  findByDeviceAndAddress(
    deviceId: string,
    address: string,
  ): Promise<Portfolio | null> {
    return this.portfolioModel.findOne({ deviceId, address });
  }

  upsert(
    deviceId: string,
    address: string,
    tokens: PortfolioToken[],
    totalValueUsd: string,
  ): Promise<Portfolio> {
    return this.portfolioModel.findOneAndUpdate(
      { deviceId, address },
      {
        $set: {
          tokens,
          totalValueUsd,
          stale: false,
          syncStatus: PortfolioSyncStatus.idle,
          lastSyncedAt: new Date(),
          lastSyncError: null,
        },
      },
      { upsert: true, new: true },
    ) as unknown as Promise<Portfolio>;
  }

  markSyncing(deviceId: string, address: string) {
    return this.portfolioModel.updateOne(
      { deviceId, address },
      { $set: { syncStatus: PortfolioSyncStatus.syncing } },
    );
  }

  markFailed(deviceId: string, address: string, error: string) {
    return this.portfolioModel.updateOne(
      { deviceId, address },
      {
        $set: {
          syncStatus: PortfolioSyncStatus.failed,
          lastSyncError: error,
        },
      },
    );
  }

  markStaleByAddress(address: string) {
    return this.portfolioModel.updateMany(
      { address },
      { $set: { stale: true } },
    );
  }
}
