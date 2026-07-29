import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { GetPortfolioDto } from './dto/get-portfolio.dto';

@Controller('api/v1/portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('/:address')
  async getPortfolio(
    @Req() req: any,
    @Res() response,
    @Param() { address }: GetPortfolioDto,
  ) {
    const tokens = await this.portfolioService.getPortfolio(
      req.device._id,
      address,
    );
    response.status(201).json(tokens);
  }
}
