import { SecretsManager } from "@aws-sdk/client-secrets-manager";
import { fromIni } from "@aws-sdk/credential-provider-ini";

const REGION = process.env.AWS_REGION || "ap-northeast-2";

/**
 * NestFactory.create() 전에 호출 — 앱이 쓰는 비밀 값(DATABASE_URL, JWT_SECRET)을 환경변수로 채운다.
 *
 * 경우별 동작 (process.env 는 호출 시점에 읽는다 — .env.<stage> override 이후 값을 쓰기 위해)
 * - 로컬 docker DB: .env 에 DATABASE_URL / JWT_SECRET 이 있으면 아무것도 하지 않음
 * - Lambda: RDS_SECRET_ARN + RDS_ENDPOINT, JWT_SECRET_ARN 으로 Secrets Manager 조회
 * - 로컬에서 AWS RDS 접속(IS_LOCAL): 같은 방식이되 AWS_PROFILE 자격증명 + SSH 터널(localhost:RDS_LOCAL_PORT)
 *
 * STAGE 가 지정되어 있으면(.env.<stage> 로 명시 실행) 이미 있는 DATABASE_URL 을 무시하고 다시 조회한다.
 * .env 의 로컬 DB 주소가 남아 있는 상태에서 dev RDS 작업을 하다 엉뚱한 DB 를 건드리는 사고 방지.
 */
export async function resolveRuntimeSecrets(): Promise<void> {
  const isLocal = !!process.env.IS_LOCAL;
  const needDb = !process.env.DATABASE_URL || !!process.env.STAGE;
  const needJwt = !process.env.JWT_SECRET;
  if (!needDb && !needJwt) return;

  const sm = new SecretsManager({
    region: REGION,
    ...(isLocal ? { credentials: fromIni({ profile: process.env.AWS_PROFILE }) } : {}),
  });

  if (needDb) {
    const secretArn = process.env.RDS_SECRET_ARN;
    const endpoint = process.env.RDS_ENDPOINT;
    if (!secretArn || !endpoint) {
      throw new Error("DATABASE_URL 또는 RDS_SECRET_ARN + RDS_ENDPOINT 가 필요합니다");
    }
    const res = await sm.getSecretValue({ SecretId: secretArn });
    const secret = JSON.parse(res.SecretString || "{}") as {
      username: string;
      password: string;
      port?: number;
    };
    const host = isLocal ? "localhost" : endpoint;
    const port = isLocal ? process.env.RDS_LOCAL_PORT || "15442" : String(secret.port || 5432);
    const dbName = process.env.RDS_DB_NAME || "weekly_report";
    // Lambda 는 동시 실행마다 인스턴스가 따로 뜨므로 인스턴스당 연결 1개로 제한 (RDS micro 연결 수 보호)
    const params = isLocal ? "" : "?connection_limit=1";
    process.env.DATABASE_URL = `postgresql://${encodeUserInfo(secret.username)}:${encodeUserInfo(secret.password)}@${host}:${port}/${dbName}${params}`;
    console.log(`[DB] ${isLocal ? `로컬 터널 localhost:${port}` : "Lambda → RDS"} 연결`);
  }

  if (needJwt) {
    const jwtArn = process.env.JWT_SECRET_ARN;
    if (!jwtArn) throw new Error("JWT_SECRET 또는 JWT_SECRET_ARN 이 필요합니다");
    const res = await sm.getSecretValue({ SecretId: jwtArn });
    if (!res.SecretString) throw new Error("JWT 시크릿 값이 비어 있습니다");
    process.env.JWT_SECRET = res.SecretString;
  }
}

/** URL user-info 용 인코딩 — unreserved([A-Za-z0-9-_.~]) 외 모든 문자를 percent-encode */
export function encodeUserInfo(value: string): string {
  return [...Buffer.from(value, "utf8")]
    .map((b) => {
      const c = String.fromCharCode(b);
      return /[A-Za-z0-9\-_.~]/.test(c) ? c : `%${b.toString(16).toUpperCase().padStart(2, "0")}`;
    })
    .join("");
}
