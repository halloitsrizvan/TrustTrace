import { Module } from '@nestjs/common';
import { ClaimsModule } from '../claims/claims.module.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

@Module({ imports: [ClaimsModule], controllers: [AdminController], providers: [AdminService], exports: [AdminService] })
export class AdminModule {}
