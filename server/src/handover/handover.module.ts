import { Module } from '@nestjs/common';
import { HandoverController } from './handover.controller.js';
import { HandoverService } from './handover.service.js';
import { TippingModule } from '../tipping/tipping.module.js';

@Module({ imports: [TippingModule], controllers: [HandoverController], providers: [HandoverService], exports: [HandoverService] })
export class HandoverModule {}
