import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

export class PaginationDto {
  page?: number = 1;
  limit?: number = 10;
}
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): PaginatedResponse<string> {
    const data = this.appService.getHello();

    return {
      data: [data],
      total: 1,
      page: Number(page),
      limit: Number(limit),
    };
  }
}