import { randomBytes } from "crypto";

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

import { prepareEnv } from "./_load-env";

/**
 * 최초 관리자 1명 생성 (운영 초기 셋업용). 이미 있으면 아무것도 하지 않음.
 * 사용: ADMIN_EMAIL=me@lab.org ADMIN_NAME=홍길동 pnpm seed:admin
 * 임시 비밀번호는 콘솔에 1회 출력 → 첫 로그인 시 변경 강제.
 */
async function main() {
  const email = process.env.ADMIN_EMAIL;
  const name = process.env.ADMIN_NAME || "관리자";
  if (!email) {
    console.error("ADMIN_EMAIL 환경변수가 필요합니다");
    process.exit(1);
  }
  await prepareEnv();
  const prisma = new PrismaClient();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    console.log(`이미 존재하는 계정입니다: ${email}`);
  } else {
    const tempPassword = randomBytes(9).toString("base64url");
    await prisma.user.create({
      data: { email, name, role: "ADMIN", passwordHash: await hash(tempPassword, 10) },
    });
    console.log(`✅ 관리자 생성: ${email} / 임시 비밀번호: ${tempPassword}`);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
