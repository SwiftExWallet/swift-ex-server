import { Module } from '@nestjs/common';
import { TransactionListenerService } from './transaction-listener.service';

@Module({
  providers: [TransactionListenerService]
})
export class TransactionListenerModule {}
