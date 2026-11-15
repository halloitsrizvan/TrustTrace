import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { CurrentUser as AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../generated/prisma/enums.js';
import { ScanHandoverDto } from './dto/scan.dto.js';
import { HandoverService } from './handover.service.js';

@ApiTags('Handover')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('handover')
export class HandoverController {
  constructor(private readonly handover: HandoverService) {}
  @Post('scan') @ApiOkResponse({ description: 'Marks an approved claim collected' })
  scan(@Body() input: ScanHandoverDto, @CurrentUser() admin: AuthenticatedUser) { return this.handover.scan(input.token, admin); }
}
