import { Module } from '@nestjs/common';
import { SalesChannelsController } from './sales-channels.controller';
import { SalesChannelsService } from './sales-channels.service';

@Module({
  controllers: [SalesChannelsController],
  providers: [SalesChannelsService],
  exports: [SalesChannelsService],
})
export class SalesChannelsModule {}
