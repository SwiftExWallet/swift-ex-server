import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';

@Controller('api/v1/portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('/:address')
  async create(
    @Req() req: any,
    @Res() response,
    @Param('address') address: string,
  ) {
    const portfolioAddress = req.walletAddress ?? address;
    const tokens =
      await this.portfolioService.getPortfolioByAddress(portfolioAddress);
    response.status(201).json(tokens.data);
  }
}
