import { ApiProperty } from '@nestjs/swagger';

export class HotspotCountDto {
  @ApiProperty() key: string;
  @ApiProperty() count: number;
}

export class AdminStatsDto {
  @ApiProperty() totalItems: number;
  @ApiProperty() reunitedCount: number;
  @ApiProperty() avgHoursToReunite: number;
  @ApiProperty() fraudBlockedCount: number;
  @ApiProperty() openFlagged: number;
  @ApiProperty({ type: [HotspotCountDto] }) zones: HotspotCountDto[];
  @ApiProperty({ type: [HotspotCountDto] }) hours: HotspotCountDto[];
  @ApiProperty() tipsCount: number;
  @ApiProperty() tipsTotalMinor: number;
  @ApiProperty() tipConversionRate: number;
  @ApiProperty({ type: [Object] }) topFinders: object[];
}
