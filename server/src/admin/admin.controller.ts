import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { CurrentUser as AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../generated/prisma/enums.js';
import { AdminService } from './admin.service.js';
import { AdminClaimsQueryDto, AdminDecisionDto } from './dto/admin-claims.dto.js';
import { AdminAuditQueryDto } from './dto/admin-audit.dto.js';
import { AdminStatsDto } from './dto/admin-stats.dto.js';
import { AdminTipsQueryDto } from './dto/admin-tips.dto.js';

@ApiTags('Admin') @ApiBearerAuth() @Roles(Role.ADMIN) @Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}
  @Get('claims') @ApiOkResponse({ description: 'Admin claim review queue, including private proof' })
  claims(@Query() query: AdminClaimsQueryDto) { return this.admin.listClaims(query); }
  @Post('claims/:id/decision') @ApiOkResponse({ description: 'Approve or reject a flagged claim' })
  decide(@Param('id', ParseUUIDPipe) id: string, @Body() input: AdminDecisionDto, @CurrentUser() admin: AuthenticatedUser) { return this.admin.decide(id, input, admin); }
  @Get('stats') @ApiOkResponse({ type: AdminStatsDto })
  stats() { return this.admin.stats(); }
  @Get('audit') @ApiOkResponse({ description: 'Cursor-paginated audit log' })
  audit(@Query() query: AdminAuditQueryDto) { return this.admin.audit(query); }
  @Get('tips') @ApiOkResponse({ description: 'Audited tip inspection including anonymous tipper identity' })
  tips(@Query() query: AdminTipsQueryDto, @CurrentUser() admin: AuthenticatedUser) { return this.admin.tips(query, admin); }
}
