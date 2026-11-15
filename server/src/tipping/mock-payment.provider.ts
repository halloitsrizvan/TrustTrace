import { randomUUID } from 'node:crypto';
import type { PaymentOrderInput, PaymentProvider } from './payment-provider.js';

export class MockPaymentProvider implements PaymentProvider {
  async createOrder(input: PaymentOrderInput) {
    const providerOrderId = `mock_${randomUUID()}`;
    return { providerOrderId, clientPayload: { provider: 'mock', orderId: providerOrderId, amountMinor: input.amountMinor, currency: input.currency } };
  }
  verifyWebhook() { return { valid: false }; }
}
