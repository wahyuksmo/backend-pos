export interface GenerateQrisInput {
  orderId?: string;
  orderNumber: string;
  amount: number;
  customerName?: string;
  outletName?: string;
}

export interface GenerateQrisResult {
  transactionId: string;
  referenceNumber: string;
  qrString: string;
  qrDataUrl: string;
  amount: number;
  expiredAt: Date;
  provider: string;
  status: 'PENDING' | 'SUCCESS' | 'EXPIRED' | 'FAILED';
}

export interface PaymentStatusResult {
  transactionId: string;
  referenceNumber: string;
  orderId?: string;
  status: 'PENDING' | 'SUCCESS' | 'EXPIRED' | 'FAILED';
  paidAt?: Date;
  amount: number;
  paymentMethodCode: string;
}

export interface IPaymentGatewayDriver {
  readonly providerName: string;
  generateQris(input: GenerateQrisInput): Promise<GenerateQrisResult>;
  checkStatus(transactionId: string): Promise<PaymentStatusResult>;
  simulateSuccess(transactionId: string): Promise<PaymentStatusResult>;
}
