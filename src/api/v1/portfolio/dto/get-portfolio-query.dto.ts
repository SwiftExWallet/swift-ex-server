import { IsBooleanString, IsOptional } from 'class-validator';

export class GetPortfolioQueryDto {
  @IsOptional()
  @IsBooleanString()
  hardRefresh?: string;
}
