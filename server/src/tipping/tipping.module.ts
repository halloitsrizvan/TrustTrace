import { Global, Module, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MockPaymentProvider } from './mock-payment.provider.js';
import { PAYMENT_PROVIDER } from './payment-provider.js';

@Global()
@Module({
  providers: [{
    provide: PAYMENT_PROVIDER,
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const provider = config.getOrThrow<string>('PAYMENT_PROVIDER');
      if (provider === 'mock') return new MockPaymentProvider();
      throw new NotImplementedException('Razorpay is intentionally excluded from this build');
    },
  }],
  exports: [PAYMENT_PROVIDER],
})
export class TippingModule {}
