import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

import { prepareEnv } from "./_load-env";

/**
 * 개발용 시드 (local / dev). STAGE=prd 에서는 실행 불가. 이미 있으면 건너뜀 (upsert, 데이터 삭제 없음).
 * 모든 테스트 계정 비밀번호: test1234
 */
async function main() {
  const stage = await prepareEnv();
  if (stage === "prd")
    throw new Error("prd 에는 테스트 데이터를 넣을 수 없습니다. seed:admin 을 사용하세요.");
  const prisma = new PrismaClient();
  const passwordHash = await hash("test1234", 10);

  const users = [
    {
      email: "admin@lab.local",
      name: "관리자",
      role: "ADMIN" as const,
      department: "연구지원팀",
      position: "팀장",
    },
    {
      email: "member1@lab.local",
      name: "김연구",
      role: "MEMBER" as const,
      department: "AI연구실",
      position: "선임연구원",
    },
    {
      email: "member2@lab.local",
      name: "이개발",
      role: "MEMBER" as const,
      department: "AI연구실",
      position: "연구원",
    },
    {
      email: "member3@lab.local",
      name: "박실험",
      role: "MEMBER" as const,
      department: "데이터연구실",
      position: "책임연구원",
    },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash, passwordChanged: true },
    });
  }

  const projects = [
    { code: "2026-NRF-001", name: "차세대 AI 모델 경량화 연구", description: "한국연구재단 과제" },
    { code: "2026-IITP-002", name: "산업용 데이터 플랫폼 구축", description: "IITP 과제" },
    { code: "2026-INT-001", name: "연구소 내부 업무 (공통)", description: "회의, 행정, 교육 등" },
  ];
  for (const [i, p] of projects.entries()) {
    await prisma.project.upsert({
      where: { code: p.code },
      update: {},
      create: { ...p, sortOrder: i },
    });
  }

  console.log(
    `✅ 시드 완료 — 사용자 ${users.length}명, 프로젝트 ${projects.length}개 (비밀번호: test1234)`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
