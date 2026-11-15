import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { CurrentUser as AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import {
  SignedUploadResponseDto,
  SignUploadDto,
} from './dto/sign-upload.dto.js';
import { UploadsService } from './uploads.service.js';

@ApiTags('Uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('sign')
  @ApiOperation({
    summary: 'Create a signed image upload URL',
    description:
      'Uploads are limited to JPEG, PNG, or WebP and 5 MB. Configure the same limit on the Supabase bucket.',
  })
  @ApiCreatedResponse({ type: SignedUploadResponseDto })
  sign(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: SignUploadDto,
  ): Promise<SignedUploadResponseDto> {
    return this.uploads.sign(user, input);
  }
}
