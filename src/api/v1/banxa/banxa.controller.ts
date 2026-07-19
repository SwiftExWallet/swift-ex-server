import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { UserQueueService } from 'src/common/user-queue/user-queue.service';
import { BanxaService } from './banxa.service';
import { Response } from 'express';
import { AssetsDto, QuotesDto } from './dto/banxa-quotes.dto';
import { CreateOrderDto } from './dto/banxa-create-order.dto';
import { BanxaWebhookService } from './banxaWebhook.service';

@Controller('api/v1/banxa/')
export class BanxaController {
  private readonly logger = new Logger(BanxaController.name);
  constructor(
    private readonly banxaService: BanxaService,
    private userQueueService: UserQueueService,
    private readonly banxaWebhookService: BanxaWebhookService,
  ) {}

  @Get('fetch-assets')
  async getAssets(@Query() payload: AssetsDto) {
    return this.banxaService.fetchAssets(payload);
  }

  @Post('fetch-quotes')
  async fetchQuotes(@Res() response: Response, @Body() quotesDto: QuotesDto) {
    return this.userQueueService.processUserRequest(async () => {
      this.logger.log('banxa-fetch-quotes');
      const quotesRes = await this.banxaService.fetchQuotes(quotesDto);
      response.send({ success: quotesRes.status, data: quotesRes.data });
    });
  }

  @Post('create-buy-order')
  async createBuyOrder(
    @Req() req: any,
    @Res() response: Response,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const orderPayload = {
      ...createOrderDto,
      walletAddress: req.walletAddress ?? createOrderDto.walletAddress,
    };
    const quotesRes = await this.banxaService.buyOrderCreate(
      orderPayload,
      req.device,
    );
    response.send({ success: quotesRes });
  }

  @Post('create-sell-order')
  async createSellOrder(
    @Req() req: any,
    @Res() response: Response,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const orderPayload = {
      ...createOrderDto,
      walletAddress: req.walletAddress ?? createOrderDto.walletAddress,
    };
    const quotesRes = await this.banxaService.sellOrderCreate(
      orderPayload,
      req.device,
    );
    response.send({ success: quotesRes });
  }

  @Post('banxa')
  @HttpCode(200)
  async handleBanxaRamp(@Body() body: any) {
    await this.banxaWebhookService.handleWebHook(body);
    return { status: 'ok', message: 'banxa webhook received.' };
  }
}
