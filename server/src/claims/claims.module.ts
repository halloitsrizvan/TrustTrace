import { Module } from '@nestjs/common';
import { ClaimsController } from './claims.controller.js';
import { ClaimsService } from './claims.service.js';
import { ClaimsJobs } from './claims.jobs.js';

@Module({ controllers: [ClaimsController], providers: [ClaimsService, ClaimsJobs], exports: [ClaimsService] })
export class ClaimsModule {}
