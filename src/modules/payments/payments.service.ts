import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { MockQrisDriver } from './drivers/mock-qris.driver';
import { GenerateQrisDto } from './dto/generate-qris.dto';
import { SimulateQrisDto } from './dto/simulate-qris.dto';
import { GenerateQrisResult, PaymentStatusResult } from './interfaces/payment-gateway.interface';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly mockDriver: MockQrisDriver,
  ) {}

  async generateQris(dto: GenerateQrisDto): Promise<GenerateQrisResult> {
    if (dto.orderId) {
      const order = await this.prisma.posOrder.findUnique({
        where: { orderId: dto.orderId },
      });
      if (!order) {
        throw new NotFoundException(`Pesanan ${dto.orderId} tidak ditemukan`);
      }
      if (order.paymentStatus === 'PAID') {
        throw new BadRequestException(`Pesanan ${order.orderNumber} sudah lunas`);
      }
    }

    return this.mockDriver.generateQris(dto);
  }

  async checkQrisStatus(transactionId: string): Promise<PaymentStatusResult> {
    return this.mockDriver.checkStatus(transactionId);
  }

  async simulateQrisSuccess(dto: SimulateQrisDto, username = 'KASIR_DEMO'): Promise<{
    payment: PaymentStatusResult;
    orderUpdated?: boolean;
    order?: any;
  }> {
    const payment = await this.mockDriver.simulateSuccess(dto.transactionId);

    let order = null;
    let orderUpdated = false;

    if (payment.orderId) {
      // Temukan metode bayar QRIS
      const qrisMethod = await this.prisma.posPaymentMethod.findFirst({
        where: {
          OR: [
            { methodType: 'QRIS' },
            { methodCode: 'PM-QRIS' },
            { methodName: { contains: 'QRIS', mode: 'insensitive' } },
          ],
          isActive: 'Y',
        },
      });

      if (!qrisMethod) {
        throw new NotFoundException('Metode pembayaran QRIS belum dikonfigurasi di Master Data');
      }

      // Catat pelunasan via OrdersService (auto release meja & potong stok inventory)
      order = await this.ordersService.addPayment(
        payment.orderId,
        {
          payments: [
            {
              paymentMethodId: qrisMethod.paymentMethodId,
              amount: payment.amount,
              tenderedAmount: payment.amount,
              referenceNumber: payment.referenceNumber,
            },
          ],
        },
        username,
      );
      orderUpdated = true;
    }

    return {
      payment,
      orderUpdated,
      order,
    };
  }

  async handleWebhook(body: any): Promise<{ received: boolean; transactionId?: string }> {
    // Standard webhook callback handler (Midtrans / Xendit / Simulator)
    const transactionId = body.transactionId || body.order_id || body.external_id;
    if (!transactionId) {
      return { received: false };
    }

    if (body.status === 'SUCCESS' || body.transaction_status === 'settlement' || body.status === 'COMPLETED') {
      try {
        await this.simulateQrisSuccess({ transactionId }, 'WEBHOOK_GATEWAY');
      } catch (err) {
        // silent capture or log
      }
    }

    return { received: true, transactionId };
  }
}
