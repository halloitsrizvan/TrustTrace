import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { CurrentUser as AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { TipQueryDto } from './dto/tip-query.dto.js';
import { TipsService } from './tips.service.js';

@ApiTags('Wallet') @ApiBearerAuth() @Controller('wallet')
export class WalletController {
  constructor(private readonly tips: TipsService) {}
  @Get() @ApiOkResponse({ description: 'Derived balance in minor units and immutable ledger entries' })
  get(@CurrentUser() user: AuthenticatedUser, @Query() query: TipQueryDto) { return this.tips.wallet(user.id, query); }
}
