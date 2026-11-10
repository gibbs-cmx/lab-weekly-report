import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MAX_TEXT_LENGTH } from "@wr/shared";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from "class-validator";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MESSAGE = "날짜는 YYYY-MM-DD 형식이어야 합니다";

export class ReportItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  projectId: number;

  @ApiProperty({ example: 60, description: "참여율 (%) 1~100" })
  @IsInt()
  participationRate: number;

  @ApiProperty({ example: "모델 양자화 실험 (INT8) 및 결과 정리" })
  @IsString()
  @MaxLength(MAX_TEXT_LENGTH)
  doneText: string;

  @ApiPropertyOptional({ example: "INT4 실험 진행" })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_TEXT_LENGTH)
  planText?: string;
}

export class SaveReportDto {
  @ApiProperty({ example: "2026-11-09", description: "주 시작일 (월요일)" })
  @Matches(DATE_PATTERN, { message: DATE_MESSAGE })
  weekStart: string;

  @ApiPropertyOptional({ example: "GPU 서버 증설 필요" })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_TEXT_LENGTH)
  note?: string;

  @ApiProperty({ type: [ReportItemDto] })
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ReportItemDto)
  items: ReportItemDto[];
}

export class WeekQueryDto {
  @ApiProperty({ example: "2026-11-09", description: "주 시작일 (월요일)" })
  @Matches(DATE_PATTERN, { message: DATE_MESSAGE })
  weekStart: string;
}

export class RangeQueryDto {
  @ApiPropertyOptional({ example: "2026-09-01", description: "시작일 (해당 주 월요일로 보정)" })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: DATE_MESSAGE })
  from?: string;

  @ApiPropertyOptional({ example: "2026-11-30", description: "종료일 (해당 주 월요일로 보정)" })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: DATE_MESSAGE })
  to?: string;
}

export class ParticipationQueryDto {
  @ApiProperty({ example: "2026-09-01" })
  @Matches(DATE_PATTERN, { message: DATE_MESSAGE })
  from: string;

  @ApiProperty({ example: "2026-11-30" })
  @Matches(DATE_PATTERN, { message: DATE_MESSAGE })
  to: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  projectId?: number;
}
