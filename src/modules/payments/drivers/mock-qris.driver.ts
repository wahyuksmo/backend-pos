import { Injectable, NotFoundException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import {
  GenerateQrisInput,
  GenerateQrisResult,
  IPaymentGatewayDriver,
  PaymentStatusResult,
} from '../interfaces/payment-gateway.interface';

interface StoredTransaction {
  transactionId: string;
  referenceNumber: string;
  orderId?: string;
  amount: number;
  qrString: string;
  qrDataUrl: string;
  expiredAt: Date;
  status: 'PENDING' | 'SUCCESS' | 'EXPIRED' | 'FAILED';
  paidAt?: Date;
}

@Injectable()
export class MockQrisDriver implements IPaymentGatewayDriver {
  readonly providerName = 'SIMULATOR_MOCK_QRIS';
  private transactions = new Map<string, StoredTransaction>();

  async generateQris(input: GenerateQrisInput): Promise<GenerateQrisResult> {
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const transactionId = `TXQ-${timestamp}-${randomHex}`;
    const referenceNumber = `REF-QRIS-${timestamp}`;

    // Standard simulated QRIS string
    const sanitizedAmount = Math.round(input.amount);
    const qrString = `00020101021226590014ID.LINKAJA.WWW01189360091100212132330215${referenceNumber}5204581253033605407${sanitizedAmount}5802ID5915${(input.outletName || 'POS STORE').slice(0, 15)}6007JAKARTA62070703A016304${randomHex}`;

    // Generate high resolution PNG data URL
    const qrDataUrl = await QRCode.toDataURL(qrString, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    const expiredAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    const stored: StoredTransaction = {
      transactionId,
      referenceNumber,
      orderId: input.orderId,
      amount: input.amount,
      qrString,
      qrDataUrl,
      expiredAt,
      status: 'PENDING',
    };

    this.transactions.set(transactionId, stored);

    return {
      transactionId,
      referenceNumber,
      qrString,
      qrDataUrl,
      amount: input.amount,
      expiredAt,
      provider: this.providerName,
      status: 'PENDING',
    };
  }

  async checkStatus(transactionId: string): Promise<PaymentStatusResult> {
    const tx = this.transactions.get(transactionId);
    if (!tx) {
      throw new NotFoundException(`Transaksi QRIS "${transactionId}" tidak ditemukan`);
    }

    if (tx.status === 'PENDING' && new Date() > tx.expiredAt) {
      tx.status = 'EXPIRED';
    }

    return {
      transactionId: tx.transactionId,
      referenceNumber: tx.referenceNumber,
      orderId: tx.orderId,
      status: tx.status,
      paidAt: tx.paidAt,
      amount: tx.amount,
      paymentMethodCode: 'PM-QRIS',
    };
  }

  async simulateSuccess(transactionId: string): Promise<PaymentStatusResult> {
    const tx = this.transactions.get(transactionId);
    if (!tx) {
      throw new NotFoundException(`Transaksi QRIS "${transactionId}" tidak ditemukan`);
    }

    tx.status = 'SUCCESS';
    tx.paidAt = new Date();

    return {
      transactionId: tx.transactionId,
      referenceNumber: tx.referenceNumber,
      orderId: tx.orderId,
      status: 'SUCCESS',
      paidAt: tx.paidAt,
      amount: tx.amount,
      paymentMethodCode: 'PM-QRIS',
    };
  }
}
