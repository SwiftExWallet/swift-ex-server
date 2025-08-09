import { Module } from '@nestjs/common';
import { WatcherService } from './watcher.service';
import { AlchemyModule } from '../alchemy/alchemy.module';

@Module({
  imports: [AlchemyModule],
  providers: [WatcherService],
  exports: [WatcherService],
})
export class WatcherModule {}
