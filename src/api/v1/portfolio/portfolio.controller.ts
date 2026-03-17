import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';

@Controller('api/v1portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('/:address')
  async create(
    @Req() req: any,
    @Res() response,
    @Param('address') address: string,
  ) {
    const tokens = await this.portfolioService.getPortfolioByAddress(address);
    response.status(201).json({ tokens });
  }
}
