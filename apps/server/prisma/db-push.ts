import { execSync } from "child_process";

import { prepareEnv } from "./_load-env";

/** STAGE 환경의 DB 에 스키마 반영 (prisma db push). 추가 인자는 그대로 전달 */
async function main() {
  const stage = await prepareEnv();
  const extraArgs = process.argv.slice(2).join(" ");
  const cmd = `npx prisma db push${extraArgs ? ` ${extraArgs}` : ""}`;
  console.log(`[DB Push:${stage}] ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: process.env });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
