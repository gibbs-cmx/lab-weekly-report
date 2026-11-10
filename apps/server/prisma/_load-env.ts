import { config } from "dotenv";

import { resolveRuntimeSecrets } from "../src/lambda/functions/api-server/prisma/resolve-runtime-secrets";

/**
 * prisma 헬퍼 스크립트(db-push, seed) 공통 진입점.
 * - STAGE 없음: .env (로컬 docker DB)
 * - STAGE=dev : .env.dev 를 override 로 로드 → Secrets Manager 에서 DATABASE_URL 조회 (SSH 터널 필요)
 */
export async function prepareEnv(): Promise<string> {
  const stage = process.env.STAGE;
  if (!stage) {
    config();
    console.log("[ENV] .env (local)");
  } else {
    if (stage !== "dev" && stage !== "prd") {
      throw new Error(`STAGE 는 dev 또는 prd 만 가능합니다 (입력값: ${stage})`);
    }
    // override: 이미 로드된 .env(로컬 DB)가 남아 엉뚱한 DB 를 건드리지 않게 한다
    config({ path: `.env.${stage}`, override: true });
    console.log(`[ENV] .env.${stage} (override)`);
  }
  await resolveRuntimeSecrets();
  return stage ?? "local";
}
