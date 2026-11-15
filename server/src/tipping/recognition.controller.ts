import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Public } from '../auth/decorators/public.decorator.js';
import { RecognitionProfilesService } from './recognition-profiles.service.js';

export class LeaderboardQueryDto {
  @ApiPropertyOptional({ enum: ['week', 'month', 'all'], default: 'all' }) @IsOptional() @IsIn(['week', 'month', 'all']) period: 'week' | 'month' | 'all' = 'all';
  @ApiPropertyOptional({ maximum: 50, default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit = 20;
}

@ApiTags('Recognition') @Controller()
export class RecognitionController {
  constructor(private readonly profiles: RecognitionProfilesService) {}
  @Public() @Get('users/:id/public-profile') @ApiOkResponse({ description: 'Public profile without email or money' })
  profile(@Param('id', ParseUUIDPipe) id: string) { return this.profiles.profile(id); }
  @Public() @Get('leaderboard/finders') @ApiOkResponse({ description: 'Campus Heroes ranked by returns then karma' })
  leaderboard(@Query() query: LeaderboardQueryDto) { return this.profiles.leaderboard(query); }
}
