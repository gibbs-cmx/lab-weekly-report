# Weekly Report — 연구소 주간보고 시스템

어드민이 프로젝트를 등록하고, 구성원이 주차별로 **프로젝트 · 참여율 · 수행 내용 · 다음 주 계획**을 작성/제출하는 시스템.

| 앱            | 설명                                                  | 포트 |
| ------------- | ----------------------------------------------------- | ---- |
| `apps/web`    | 구성원 — 주간보고 작성, 내 보고서                     | 3200 |
| `apps/admin`  | 관리자 — 제출 현황, 참여율 집계, 프로젝트/사용자 관리 | 3201 |
| `apps/server` | NestJS REST API — 배포는 API Gateway + Lambda (CDK)   | 4200 |

## 시작하기

사전 요구: [mise](https://mise.jdx.dev) (Node 24 / pnpm 10 자동 설치), Docker

```bash
mise install
pnpm install
cp apps/server/.env.example apps/server/.env   # 최초 1회
pnpm db:up && pnpm db:push && pnpm db:seed
pnpm dev
```

- 구성원: http://localhost:3200 — `member1@lab.local` / `test1234`
- 관리자: http://localhost:3201 — `admin@lab.local` / `test1234`
- API 문서: http://localhost:4200/api/docs

## 명령어

| 명령             | 설명                           |
| ---------------- | ------------------------------ |
| `pnpm dev`       | server + web + admin 동시 실행 |
| `pnpm build`     | 전체 빌드                      |
| `pnpm lint`      | 전체 lint                      |
| `pnpm test`      | 서버 단위 테스트 (Vitest)      |
| `pnpm db:up`     | 로컬 PostgreSQL 컨테이너 기동  |
| `pnpm db:push`   | Prisma 스키마 → DB 반영        |
| `pnpm db:seed`   | 테스트 데이터 (upsert)         |
| `pnpm db:studio` | Prisma Studio                  |

AWS 배포 절차는 [apps/server/CLAUDE.md](apps/server/CLAUDE.md) 의 "최초 배포 순서" 참고 (배포는 사람이 직접 실행).

자세한 규칙은 [CLAUDE.md](CLAUDE.md), [apps/server/CLAUDE.md](apps/server/CLAUDE.md), 요구사항은 [docs/1.requirements/spec.md](docs/1.requirements/spec.md).
