import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { PROJECT_STATUSES, type ProjectStatus } from "@wr/shared";
import { IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class CreateProjectDto {
  @ApiProperty({ example: "2026-NRF-001", description: "과제 코드 (unique)" })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: "차세대 AI 모델 경량화 연구" })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: "한국연구재단 과제" })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: PROJECT_STATUSES })
  @IsOptional()
  @IsIn(PROJECT_STATUSES)
  status?: ProjectStatus;

  @ApiPropertyOptional({
    example: "2026-03-01",
    description: "과제 시작일 (YYYY-MM-DD), 비우려면 null",
  })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: "날짜는 YYYY-MM-DD 형식이어야 합니다" })
  startDate?: string | null;

  @ApiPropertyOptional({ example: "2026-12-31" })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: "날짜는 YYYY-MM-DD 형식이어야 합니다" })
  endDate?: string | null;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class ListProjectsQueryDto {
  @ApiPropertyOptional({ enum: PROJECT_STATUSES })
  @IsOptional()
  @IsIn(PROJECT_STATUSES)
  status?: ProjectStatus;
}
