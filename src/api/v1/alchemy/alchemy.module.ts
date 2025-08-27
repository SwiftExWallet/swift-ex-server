import { Module } from '@nestjs/common';
import { AlchemyService } from './alchemy.service';
import { UrlSigner } from './util/urlSigner';
import { HttpService } from './http.service';
import { AlchemyController } from './alchemy.controller';

@Module({
  providers: [AlchemyService, UrlSigner, HttpService],
  exports: [HttpService],
  controllers: [AlchemyController],
})
export class AlchemyModule {}
