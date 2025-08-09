import { Test, TestingModule } from '@nestjs/testing';
import { TransactionListenerService } from './transaction-listener.service';

describe('TransactionListenerService', () => {
  let service: TransactionListenerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionListenerService],
    }).compile();

    service = module.get<TransactionListenerService>(TransactionListenerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
