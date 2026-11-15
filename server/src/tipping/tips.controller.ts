import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CurrentUser as AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreateTipDto } from './dto/create-tip.dto.js';
import { TipsService } from './tips.service.js';

@ApiTags('Tips') @ApiBearerAuth() @Controller('tips')
export class TipsController {
  constructor(private readonly tips: TipsService) {}
  @Get('eligibility/:claimId') @ApiOkResponse({ description: 'Post-handover tip eligibility and bounds' })
  eligibility(@Param('claimId', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) { return this.tips.eligibility(id, user); }
  @Post() @Throttle({ default: { limit: 5, ttl: 60_000 } }) @ApiOkResponse({ description: 'Creates an idempotent pending tip order' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateTipDto, @Headers('idempotency-key') key: string) { return this.tips.create(user, input, key); }
  @Post(':id/confirm') @ApiOkResponse({ description: 'Confirms a mock payment' })
  confirm(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) { return this.tips.confirm(id, user); }
}
