import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: 'ok';

  @ApiProperty({ enum: ['ok', 'down'] })
  db: 'ok' | 'down';

  @ApiProperty({ example: '2026-11-15T10:00:00.000Z' })
  time: string;
}
