import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { AlchemyService } from './alchemy.service';
import { Response } from 'express';
import { QuotesDto } from './dto/alchemy-quotes-order.dto';
import { CreateBuyOrderDto } from './dto/alchemy-create-order.dto';
import { SellOrderDto } from './dto/alchemy-sell-order.dto';

@Controller('api/v1/alchemy/')
export class AlchemyController {
  constructor(private readonly alchemyService: AlchemyService) {}

  @Post('fetch-quotes')
  async fetchQuotes(@Res() response: Response, @Body() quotesDto: QuotesDto) {
    const quotesRes = await this.alchemyService.fetchQuotes(quotesDto);
    response.send({ success: quotesRes.status, data: quotesRes.data });
  }

  @Post('create-buy-order')
  async createBuyOrder(
    @Req() req: any,
    @Res() response: Response,
    @Body() createBuyOrderDto: CreateBuyOrderDto,
  ) {
    const quotesRes = await this.alchemyService.orderCreate(
      createBuyOrderDto,
      req.email,
    );
    response.send({ success: quotesRes });
  }

  @Post('create-sell-order')
  async createSellOrder(
    @Req() req: any,
    @Res() response: Response,
    @Body() sellOrderDto: SellOrderDto,
  ) {
    const quotesRes = await this.alchemyService.sellOrderCreate(
      sellOrderDto,
      req.email,
    );
    response.send({ success: quotesRes });
  }
}
