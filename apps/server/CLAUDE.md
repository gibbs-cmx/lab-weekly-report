## 서버 개요

NestJS 11 REST API — **API Gateway + Lambda** 배포, 로컬 동시 지원 (ygpa-pms 와 같은 구조).
API Gateway 가 모든 요청을 Lambda 하나로 넘기고, Lambda 안에서 NestJS 가 라우팅한다.

## 소스 구조

```
src/lambda/functions/api-server/
├── main.ts              # Lambda 핸들러 (@vendia/serverless-express) — 콜드 스타트 때 앱 1회 생성
├── localhost.ts         # 로컬 개발 서버 (포트 4200)
├── configure-app.ts     # 두 진입점이 공유하는 설정 (CORS, ValidationPipe, prefix, Swagger)
├── app.module.ts
├── auth/                # 로그인(JWT 8h), 비밀번호 변경
├── user/                # GET users/me + UserService(관리자 기능 공용) + user.mapper(민감정보 제외)
├── project/             # GET projects (ACTIVE) + ProjectService
├── report/              # 주간보고 + participation.ts / stats.ts (순수 집계 함수)
├── admin/               # 관리자 컨트롤러 3개 (projects, users, reports)
├── prisma/              # PrismaService + resolve-runtime-secrets (DATABASE_URL / JWT_SECRET 준비)
└── common/              # guards, decorators, filters, interceptors, auth-user 타입
bin/cdk.ts               # CDK 앱 (stage 는 --context stage=dev)
lib/
├── base/                # BaseStack(태그/prefix), SSM 유틸
├── stateful/            # vpc-stack, rds-stack, ec2-stack(Bastion) — 수동 배포만
└── apigateway-stack.ts  # Lambda + API Gateway (stateless)
prisma/                  # schema, db-push, seed (STAGE 로 대상 DB 선택)
webpack.config.js        # Lambda 번들 → dist/bundle.js + Prisma 엔진(rhel)
```

## API 설계 규칙 (ygpa-pms 와 동일)

- **GET/POST만 사용** — PATCH/PUT/DELETE 금지
- 수정: `POST /resource/:id/update`, 삭제: `POST /resource/:id/delete`, 액션: 명시적 동사 (`/submit`, `/reopen`)
- **GET → 모든 파라미터는 query**, **POST → 모든 파라미터는 body**
- path param 은 리소스 PK 에만 (`projectId`, `userId`, `reportId`)
- 날짜는 `"YYYY-MM-DD"` 문자열
- 도메인별 컨트롤러 최소화

## 사용자 API — `/api/v1/...`

```
auth/login                         POST  로그인 {email, password}
auth/change-password               POST  비밀번호 변경 {currentPassword?, newPassword} → {message, accessToken}
users/me                           GET   내 정보
projects                           GET   선택 가능한 프로젝트 (ACTIVE)
reports?from=&to=                  GET   내 보고서 목록 (기본 최근 12주)
reports/stats?from=&to=            GET   내 통계 — 제출률, 프로젝트별 평균 참여율, 미제출 주
reports/week?weekStart=            GET   특정 주 내 보고서 (없으면 빈 응답 = null)
reports                            POST  임시저장 {weekStart, note, items[]} — 해당 주 생성/전체 교체
reports/submit                     POST  제출 (저장 + 제출, 합계 100% 필수) — 이미 제출된 보고서의 수정(다시 제출)도 이 API
```

## 관리자 API — `/api/v1/admin/...` (@Roles("ADMIN"))

```
admin/projects?status=                     GET   프로젝트 목록
admin/projects                             POST  등록
admin/projects/:projectId                  GET   상세
admin/projects/:projectId/update           POST  수정
admin/projects/:projectId/delete           POST  삭제 (보고서에 사용된 적 없을 때만)
admin/users?includeInactive=               GET   사용자 목록
admin/users                                POST  등록 → {user, tempPassword} (임시 비밀번호 1회 노출)
admin/users/:userId/update                 POST  수정 (권한/소속/직위/재직여부)
admin/users/:userId/reset-password         POST  비밀번호 초기화 + 잠금 해제 → {tempPassword}
admin/reports?weekStart=                   GET   주간 제출 현황 (MEMBER 전원, 프로젝트 배분 포함)
admin/reports/participation?from=&to=&projectId=  GET  프로젝트별 참여율 집계 (SUBMITTED 만)
admin/reports/stats?from=&to=                 GET   기간 통계 — 주차별 추이, 월별 참여율, 구성원별 제출률·프로젝트 평균 참여율·미제출 주
admin/reports/export?from=&to=                GET   내보내기용 원본 행 (보고서 항목 단위) — 엑셀 파일은 관리자 앱이 브라우저에서 생성
admin/reports/:reportId                    GET   보고서 상세
admin/reports/:reportId/reopen             POST  재오픈 (SUBMITTED → DRAFT)
```

## DB 규칙

- **FK 미사용** — `relationMode = "prisma"`, 인덱스만. Prisma relation 필드 없음 → 별도 쿼리로 조인
- 테이블/컬럼: snake_case (`@map`), Prisma 필드: camelCase, 모든 필드에 `///` 주석
- 날짜만 필요한 컬럼은 `@db.Date` (week_start, start_date, end_date)
- 스키마 변경: `prisma/schema.prisma` 수정 → `pnpm db:push` (로컬) / `pnpm db:dev:push` (dev). migrate 흐름 미사용

## 테이블

```
users                  사용자 (ADMIN / MEMBER)
projects               프로젝트 (ACTIVE / CLOSED)
weekly_reports         주간보고 (user_id + week_start unique, DRAFT / SUBMITTED)
weekly_report_items    항목 (report_id + project_id unique, participation_rate, done_text, plan_text)
```

## 순수 함수 (Hexagonal Boundary)

`packages/shared/src/{week,report-rules}.ts`, `src/lambda/functions/api-server/report/{participation,stats}.ts` 는 NestJS/Prisma import 금지. 단위 테스트 필수.

## 테스트

- **Vitest** — `pnpm test` (`src/**/*.spec.ts`)
- 테스트 수정 금지 — 테스트가 실패하면 코드를 고칠 것

## 비밀 값 처리 (`prisma/resolve-runtime-secrets.ts`)

`NestFactory.create()` 전에 호출되어 `DATABASE_URL`, `JWT_SECRET` 을 환경변수로 채운다.

| 실행 환경                                | DATABASE_URL                                                              | JWT_SECRET                         |
| ---------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------- |
| 로컬 (docker DB)                         | `.env` 값 그대로                                                          | `.env` 값 그대로                   |
| Lambda                                   | Secrets Manager (`RDS_SECRET_ARN`) + `RDS_ENDPOINT`, `connection_limit=1` | Secrets Manager (`JWT_SECRET_ARN`) |
| 로컬 → dev RDS (`STAGE=dev`, `.env.dev`) | Secrets Manager + SSH 터널 `localhost:15442`                              | `.env.dev` 값                      |

Lambda 환경변수에는 비밀 값을 평문으로 넣지 않는다 (ARN 만).

## CDK 인프라 (dev 환경만 정의)

| 스택                        | 내용                                                                         | 배포                  |
| --------------------------- | ---------------------------------------------------------------------------- | --------------------- |
| `weekly-report-dev-vpc`     | VPC 3-tier(Public / Lambda / Database), 2 AZ, **NAT Gateway 1개**, Flow Logs | 수동 (stateful)       |
| `weekly-report-dev-rds`     | PostgreSQL 16 `db.t4g.micro`, gp3 20GB, 백업 7일, 삭제 시 스냅샷             | 수동 (stateful)       |
| `weekly-report-dev-bastion` | `t4g.nano` + EIP. SSH 는 `cdk.json` 의 `sshAllowedCidrs` 만 허용             | 수동 (stateful)       |
| `weekly-report-dev-api`     | Lambda(Node 22, 1024MB, 29초) + API Gateway REST 프록시 + JWT 시크릿         | `pnpm deploy:dev:api` |

- API 스택은 VPC/RDS 스택과 **직접 의존 없음** — 필요한 값은 SSM Parameter(`/weekly-report/dev/*`)로 읽는다.
  → API 만 재배포해도 VPC/RDS 를 건드리지 않고, `pnpm cdk:synth` 는 AWS 자격증명 없이 동작한다
- 계정/프로필/IP 허용 목록/CORS 는 `cdk.json` 의 `context.env.dev` 에서 관리
- prd 가 필요해지면 `cdk.json` 에 `prd` 블록 + `deploy:prd:*` 스크립트만 추가 (스택 코드는 stage 공용)

## 최초 배포 순서 (AWS 계정 생성 후, 사람이 실행)

```bash
# 0. 준비: AWS CLI 프로필 weekly-report-dev 생성, cdk.json 의 account / sshAllowedCidrs(내 IP/32) 채우기
npx cdk bootstrap --profile weekly-report-dev

# 1. stateful (순서대로)
pnpm deploy:dev:vpc
pnpm deploy:dev:rds
pnpm deploy:dev:bastion

# 2. DB 스키마 + 최초 데이터 — .env.dev 작성, ~/.ssh/config 등록 (scripts/tunnel-rds.sh 주석 참고)
pnpm tunnel:dev:rds                     # 터미널 1
pnpm db:dev:push                        # 터미널 2
ADMIN_EMAIL=me@lab.org ADMIN_NAME=홍길동 pnpm seed:dev:admin   # 또는 pnpm seed:dev (테스트 계정)

# 3. API
pnpm deploy:dev:api                     # Outputs 의 ApiUrl → 프론트 NEXT_PUBLIC_API_URL
```

프론트 주소가 정해지면 `cdk.json` 의 `corsOrigins` 에 추가하고 `deploy:dev:api` 재실행.

## 로컬 개발

```bash
pnpm db:up && pnpm db:push && pnpm seed:local   # 최초 1회 (docker PostgreSQL, localhost:5442)
pnpm dev                                        # localhost:4200
```

| 작업            | 로컬 (docker)     | dev (AWS, 터널 필요)  |
| --------------- | ----------------- | --------------------- |
| 스키마 적용     | `pnpm db:push`    | `pnpm db:dev:push`    |
| 테스트 데이터   | `pnpm seed:local` | `pnpm seed:dev`       |
| 관리자 1명 생성 | `pnpm seed:admin` | `pnpm seed:dev:admin` |

- **Claude는 절대 배포하지 않음** — 명령어 안내만. stateful 스택은 반드시 사람이 수동 배포

## 보안 규칙

- JWT_SECRET 필수 (fallback 없음) — Lambda 에서는 Secrets Manager 자동 생성 값
- 모든 컨트롤러에 JwtAuthGuard, 어드민 컨트롤러에 RolesGuard + @Roles("ADMIN")
- 사용자 응답은 `toUserResponse()` 경유 (passwordHash 제외)
- 브루트포스 잠금 (failedLoginCount >= 5) → 어드민 비밀번호 초기화로 해제
- 임시 비밀번호로 로그인하면 비밀번호 변경 강제 (passwordChanged=false) — 서버도 강제: 임시 비밀번호 토큰(JWT `pwc=false`)은 `auth/change-password` 외 모든 API 가 403, 변경하면 새 토큰 발급
- GlobalExceptionFilter 로 Prisma 에러 노출 방지
- 개발용 매직토큰: `.env` 에 `DEV_MAGIC_TOKEN` 설정 시 `Bearer <값>` 으로 ADMIN(id=1) 통과 (production 에선 무시)
