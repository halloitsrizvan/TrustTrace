export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export interface PaymentOrderInput {
  amountMinor: number;
  currency: string;
  tipId: string;
}

export interface PaymentProvider {
  createOrder(input: PaymentOrderInput): Promise<{ providerOrderId: string; clientPayload: unknown }>;
  verifyWebhook(headers: Record<string, string | string[] | undefined>, rawBody: Buffer): {
    valid: boolean;
    event?: { providerOrderId: string; providerPaymentId: string; status: 'SUCCEEDED' | 'FAILED' };
  };
}
