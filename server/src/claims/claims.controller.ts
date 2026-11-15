import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CurrentUser as AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ClaimResponseDto, QrResponseDto } from './dto/claim-response.dto.js';
import { StartClaimDto, StartClaimResponseDto } from './dto/start-claim.dto.js';
import { SubmitClaimDto, SubmitClaimResponseDto } from './dto/submit-claim.dto.js';
import { ClaimsService } from './claims.service.js';

@ApiTags('Claims')
@ApiBearerAuth()
@Controller('claims')
export class ClaimsController {
  constructor(private readonly claims: ClaimsService) {}

  @Post('start')
  @ApiCreatedResponse({ type: StartClaimResponseDto })
  start(@CurrentUser() user: AuthenticatedUser, @Body() input: StartClaimDto) {
    return this.claims.start(user, input);
  }

  @Post(':id/submit')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOkResponse({ type: SubmitClaimResponseDto })
  submit(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() input: SubmitClaimDto) {
    return this.claims.submit(user, id, input);
  }

  @Get('mine')
  @ApiOkResponse({ type: [ClaimResponseDto] })
  mine(@CurrentUser() user: AuthenticatedUser) { return this.claims.mine(user.id); }

  @Get(':id')
  @ApiOkResponse({ type: ClaimResponseDto })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.claims.findOne(id, user.id); }

  @Get(':id/qr')
  @ApiOkResponse({ type: QrResponseDto })
  qr(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.claims.regenerateToken(id, user); }
}
