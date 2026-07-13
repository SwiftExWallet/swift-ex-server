import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  RawBodyRequest,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { MoonPayService } from './moonpay.service';
import { CurrenciesDto, LinkDto, QuoteDto } from './dto/moonpay.dto';

@Controller('/api/v1/moonpay')
export class MoonPayController {
  constructor(private readonly moonPayService: MoonPayService) { }

  @Post('currencies')
  getCurrencies(@Body() body: CurrenciesDto) {
    return this.moonPayService.getCurrencies(body.side);
  }

  @Post('quote')
  getQuote(@Body() body: QuoteDto) {
    return this.moonPayService.getQuote(
      body.side,
      body.code,
      body.amount,
      body.fiat,
    );
  }

  @Post('link')
  buildLink(@Body() linkDto: LinkDto, @Req() req: any) {
    return this.moonPayService.buildLink(linkDto, req.device);
  }

  @Post('webhook')
  handleWebhook(
    @Body() body: any,
    @Headers('moonpay-signature-v2') signatureHeader: string | null,
  ) {
    console.log("webhook",body)
    return { received: true };
  }
}