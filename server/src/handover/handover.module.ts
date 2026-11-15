import { Module } from '@nestjs/common';
import { HandoverController } from './handover.controller.js';
import { HandoverService } from './handover.service.js';

@Module({ controllers: [HandoverController], providers: [HandoverService], exports: [HandoverService] })
export class HandoverModule {}
