import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { CurrentUser as AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CreateItemDto } from './dto/create-item.dto.js';
import { ItemQueryDto } from './dto/item-query.dto.js';
import {
  CreateItemResponseDto,
  ItemPageResponseDto,
  OwnerItemResponseDto,
  PublicItemResponseDto,
} from './dto/item-response.dto.js';
import { ItemsService } from './items.service.js';

@ApiTags('Items')
@Controller('items')
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: CreateItemResponseDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateItemDto,
  ): Promise<CreateItemResponseDto> {
    return this.items.create(user, input);
  }

  @Get()
  @Public()
  @ApiOkResponse({ type: ItemPageResponseDto })
  feed(@Query() query: ItemQueryDto): Promise<ItemPageResponseDto> {
    return this.items.feed(query);
  }

  @Get('mine')
  @ApiBearerAuth()
  @ApiOkResponse({ type: [OwnerItemResponseDto] })
  mine(@CurrentUser() user: AuthenticatedUser): Promise<OwnerItemResponseDto[]> {
    return this.items.mine(user);
  }

  @Get(':id')
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOkResponse({ type: PublicItemResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<PublicItemResponseDto | OwnerItemResponseDto> {
    return this.items.findOne(id, user);
  }

  @Patch(':id/close')
  @ApiBearerAuth()
  @ApiOkResponse({ type: OwnerItemResponseDto })
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OwnerItemResponseDto> {
    return this.items.close(id, user);
  }
}
