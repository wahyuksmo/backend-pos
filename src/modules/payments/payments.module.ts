import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { OrdersModule } from '../orders/orders.module';
import { MockQrisDriver } from './drivers/mock-qris.driver';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [DatabaseModule, OrdersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, MockQrisDriver],
  exports: [PaymentsService],
})
export class PaymentsModule {}
