import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() type: string;
  @ApiProperty({ type: Object }) payload: object;
  @ApiPropertyOptional({ format: 'date-time' }) readAt: Date | null;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
}

export class NotificationPageDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  notifications: NotificationResponseDto[];
  @ApiPropertyOptional({ format: 'uuid' }) nextCursor: string | null;
}
