import { Global, Module, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MockPaymentProvider } from './mock-payment.provider.js';
import { PAYMENT_PROVIDER } from './payment-provider.js';
import { TipsController } from './tips.controller.js';
import { TipsService } from './tips.service.js';
import { WalletController } from './wallet.controller.js';
import { RecognitionService } from './recognition.service.js';

@Global()
@Module({
  controllers: [TipsController, WalletController],
  providers: [{
    provide: PAYMENT_PROVIDER,
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const provider = config.getOrThrow<string>('PAYMENT_PROVIDER');
      if (provider === 'mock') return new MockPaymentProvider();
      throw new NotImplementedException('Razorpay is intentionally excluded from this build');
    },
  }, TipsService, RecognitionService],
  exports: [PAYMENT_PROVIDER, TipsService, RecognitionService],
})
export class TippingModule {}
