import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Portfolio, PortfolioSyncStatus, PortfolioToken } from './schema/portfolio.schema';

@Injectable()
export class PortfolioRepository {
  constructor(
    @InjectModel(Portfolio.name) private portfolioModel: Model<Portfolio>,
  ) {}

  findByAddress(address: string): Promise<Portfolio | null> {
    return this.portfolioModel
      .findOne({ address })
      .sort({ lastSyncedAt: -1 });
  }

  upsert(
    deviceId: string,
    address: string,
    tokens: PortfolioToken[],
    totalValueUsd: string,
  ): Promise<Portfolio> {
    return this.portfolioModel.findOneAndUpdate(
      { address },
      {
        $set: {
          deviceId,
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

  markSyncing(address: string) {
    return this.portfolioModel.updateOne(
      { address },
      { $set: { syncStatus: PortfolioSyncStatus.syncing } },
    );
  }

  markFailed(address: string, error: string) {
    return this.portfolioModel.updateOne(
      { address },
      {
        $set: {
          syncStatus: PortfolioSyncStatus.failed,
          lastSyncError: error,
        },
      },
    );
  }

  updateDevice(address: string, deviceId: string) {
    return this.portfolioModel.updateOne(
      { address },
      { $set: { deviceId } },
    );
  }

  markStaleByAddress(address: string) {
    return this.portfolioModel.updateMany(
      { address },
      { $set: { stale: true } },
    );
  }
}
