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
    summary: 'Sign a direct Cloudinary image upload',
    description:
      'POST the returned fields plus the file to uploadUrl as multipart form data. Clients must resize to 5 MB or less.',
  })
  @ApiCreatedResponse({ type: SignedUploadResponseDto })
  sign(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: SignUploadDto,
  ): SignedUploadResponseDto {
    return this.uploads.sign(user, input);
  }
}
