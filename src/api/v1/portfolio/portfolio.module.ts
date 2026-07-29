import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { PortfolioRepository } from './portfolio.repository';
import { PortfolioMapper } from './portfolio.mapper';
import { Portfolio, PortfolioSchema } from './schema/portfolio.schema';
import { AlchemyModule } from '../alchemy/alchemy.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Portfolio.name, schema: PortfolioSchema },
    ]),
    AlchemyModule,
  ],
  providers: [PortfolioService, PortfolioRepository, PortfolioMapper],
  controllers: [PortfolioController],
})
export class PortfolioModule {}
