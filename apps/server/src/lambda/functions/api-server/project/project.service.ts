import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Project } from "@prisma/client";
import { formatDate, parseDate, type ProjectStatus } from "@wr/shared";

import { PrismaService } from "../prisma/prisma.service";

import type { CreateProjectDto, UpdateProjectDto } from "./dto/project.dto";

export function toProjectResponse(p: Project) {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    description: p.description,
    status: p.status,
    startDate: p.startDate ? formatDate(p.startDate) : null,
    endDate: p.endDate ? formatDate(p.endDate) : null,
    sortOrder: p.sortOrder,
  };
}

/** undefined → 변경 없음, null/"" → NULL, "YYYY-MM-DD" → Date */
function toDateField(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  return value ? parseDate(value) : null;
}

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async list(filter: { status?: ProjectStatus } = {}) {
    const projects = await this.prisma.project.findMany({
      where: filter.status ? { status: filter.status } : {},
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    return projects.map(toProjectResponse);
  }

  async get(id: number) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException("프로젝트를 찾을 수 없습니다");
    return toProjectResponse(project);
  }

  async create(dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        code: dto.code.trim(),
        name: dto.name.trim(),
        description: dto.description?.trim() ?? "",
        status: dto.status ?? "ACTIVE",
        startDate: toDateField(dto.startDate),
        endDate: toDateField(dto.endDate),
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    return toProjectResponse(project);
  }

  async update(id: number, dto: UpdateProjectDto) {
    await this.get(id);
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        code: dto.code?.trim(),
        name: dto.name?.trim(),
        description: dto.description?.trim(),
        status: dto.status,
        startDate: toDateField(dto.startDate),
        endDate: toDateField(dto.endDate),
        sortOrder: dto.sortOrder,
      },
    });
    return toProjectResponse(project);
  }

  /** 주간보고에 한 번이라도 쓰인 프로젝트는 삭제 불가 → CLOSED 처리 안내 */
  async delete(id: number) {
    await this.get(id);
    const used = await this.prisma.weeklyReportItem.count({ where: { projectId: id } });
    if (used > 0) {
      throw new BadRequestException(
        "주간보고에 사용된 프로젝트는 삭제할 수 없습니다. 상태를 '종료'로 변경해주세요.",
      );
    }
    await this.prisma.project.delete({ where: { id } });
    return { message: "삭제되었습니다" };
  }
}
