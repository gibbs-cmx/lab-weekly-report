## 프로젝트 개요

**연구소 주간보고 시스템** — Weekly Report

- 어드민이 프로젝트(과제)와 사용자를 등록
- 구성원은 로그인해서 주차별로 **프로젝트 선택 + 참여율(%) + 수행 내용 + 다음 주 계획**을 작성/제출
- 어드민은 주간 제출 현황, 보고서 상세, 프로젝트별 참여율 집계를 확인

구조는 `../ygpa-pms` 를 기준으로 잡았다. 서버는 **API Gateway + Lambda(NestJS)** 로 배포하는 구조이고, 로컬에서는 같은 앱을 일반 서버로 띄운다.
**AWS 계정은 아직 없음** — 인프라 코드(CDK, dev 환경)는 준비돼 있고 배포는 한 번도 하지 않았다 (`TODO.md`).

## 기술 스택

- **pnpm** workspaces + **Turborepo** monorepo, **TypeScript** 전역
- **Next.js 16** App Router — web(구성원, 3200) / admin(관리자, 3201)
- **NestJS 11** REST API — 배포: API Gateway + Lambda (`@vendia/serverless-express`, webpack 단일 번들) / 로컬: localhost:4200
- **AWS CDK** — VPC(NAT) + RDS PostgreSQL(t4g.micro) + Bastion + Lambda·API Gateway, dev 환경만
- **Prisma 6** + **PostgreSQL 16** (로컬: docker compose, FK 없음 — relationMode="prisma")
- **shadcn/ui (base-ui)** + **Tailwind CSS v4**
- **@tanstack/react-query** + **@lukemorales/query-key-factory**
- **Vitest** (서버 단위 테스트)
- Node 24 / pnpm 10 — `mise.toml` 로 고정

## 모노레포 구조

```
apps/
├── web/       # 구성원 앱 (3200) — 주간보고 작성, 내 보고서
├── admin/     # 관리자 앱 (3201) — 제출 현황, 참여율 집계, 프로젝트/사용자 관리
└── server/    # NestJS REST API (Lambda 배포 / 로컬 4200) + CDK 인프라 ← API/DB/배포 규칙은 apps/server/CLAUDE.md
packages/
└── shared/    # 서버·프론트 공용: 권한/상태 상수, 주차 유틸(week.ts), 입력 규칙(report-rules.ts)
docs/
├── 1.requirements/  # 요구사항
├── 2.design/        # 설계 문서
└── 3.impl/          # 구현 문서
```

## 핵심 도메인 규칙 (packages/shared)

- **주차**: 월요일 시작, "오늘"은 KST 기준. API 는 날짜를 항상 `"YYYY-MM-DD"` 문자열로 주고받음
- **보고서**: 사용자 × 주 당 1건. DRAFT(임시저장) → SUBMITTED(제출). 제출 후에도 본인이 수정 가능 — 고친 뒤 "다시 제출"(상태 SUBMITTED 유지, 최초 제출 시각 유지). 제출된 보고서를 임시저장으로 되돌릴 수는 없고, 어드민 재오픈 시에만 DRAFT 로 복귀
- **참여율**: 항목당 1~100 정수, 보고서 내 합계 ≤ 100. **제출 시 합계 = 100%** (`REQUIRED_TOTAL_RATE`)
- **프로젝트**: ACTIVE 만 선택 가능. 보고서에 사용된 프로젝트는 삭제 불가 → CLOSED 처리
- 미래 주차는 작성 불가
- 규칙 변경 시 `packages/shared/src/report-rules.ts` 한 곳만 수정 (서버 검증 + 프론트 입력 가이드 공용)

## 프론트엔드 아키텍처 (FSD 스타일, web/admin 공통)

- `shared/ui/` — 기본 컴포넌트 (button, input, card, dialog, table …) + 도메인 컴포넌트 (allocation-bar, report-status-badge, segmented, week-navigator, avatar). **두 앱의 `shared/ui`, `globals.css`, `sidebar.tsx`, `page-header.tsx`, `project-color.ts`, `types.ts` 는 같은 내용 — 한쪽을 고치면 다른 쪽에도 복사**
- `shared/api/` — `http.ts`(fetch 래퍼/토큰) · `api.ts`(엔드포인트) · `types.ts` · `query-keys.ts` · `queries.ts`(React Query hooks)
- `shared/auth/` — AuthProvider (미로그인 → /login, 임시 비밀번호 → /change-password)
- `shared/lib/` — `cn`, `use-week-param`(URL `?week=` 로 주차 상태 관리), `project-color`(프로젝트·아바타 색)
- `features/` — 화면 단위 복합 컴포넌트 (web: report-editor / admin: report-detail-dialog, stats/_, export/_ — 엑셀은 `write-excel-file` 로 브라우저에서 생성)
- `widgets/layout/ui/` — 사이드바(tone: light/dark), 페이지 헤더

## 로컬 개발

```bash
pnpm install
pnpm db:up          # PostgreSQL 컨테이너 (localhost:5442)
pnpm db:push        # 스키마 반영 (prisma db push)
pnpm db:seed        # 테스트 계정/프로젝트 (upsert, 삭제 없음)
pnpm dev            # server(4200) + web(3200) + admin(3201) 동시 실행
```

- Swagger: http://localhost:4200/api/docs
- `apps/server/.env` 는 `.env.example` 복사본 (DATABASE_URL, JWT_SECRET)

## 테스트 계정 (비밀번호: test1234)

| 역할   | 이메일            | 이름 / 소속           |
| ------ | ----------------- | --------------------- |
| 관리자 | admin@lab.local   | 관리자 / 연구지원팀   |
| 구성원 | member1@lab.local | 김연구 / AI연구실     |
| 구성원 | member2@lab.local | 이개발 / AI연구실     |
| 구성원 | member3@lab.local | 박실험 / 데이터연구실 |

## 디자인 시스템

시각/UI 결정 전에 **DESIGN.md** 를 먼저 읽을 것 ("연구노트" 시스템 — 종이색 바탕, 잉크 텍스트, IBM Plex, 프로젝트 색 배분 막대).
사용자 승인 없이 벗어나지 말 것. 화면을 바꾸면 헤드리스 브라우저로 캡처해 확인할 것.

## 코딩 스타일

Prettier 포매터. TypeScript 기본.

- **파일명**: kebab-case / **컴포넌트**: PascalCase / **함수·변수**: camelCase
- **DB 테이블/컬럼**: snake_case / **환경 변수**: SCREAMING_SNAKE_CASE
- **NEVER use `any` type** — `unknown` + 타입 가드 사용

## 운영 규칙

- **❌ Claude는 절대 배포하지 않음** — `cdk deploy` 등은 명령어 안내만
- **❌ stateful 스택(VPC, RDS, Bastion) 자동 배포 금지** — 사람이 수동으로
- **❌ DB 데이터 삭제/초기화 금지** — seed 는 upsert 만
- **커밋 금지**: 사용자가 명시적으로 요청하기 전까지 절대 커밋하지 말 것
- Conventional Commits (`feat:`, `fix:`, `docs:` 등), 한국어 body 허용
- 새로운 문서, 주석, 변경 로그는 모두 한글로 작성

## 코딩 작업 행동 지침

LLM 코딩에서 흔히 나오는 실수를 줄이기 위한 행동 지침. 프로젝트별 지침과 함께 적용한다.

**트레이드오프:** 이 지침은 속도보다 신중함에 무게를 둔다. 사소한 작업은 판단에 맡긴다.

### 1. 코딩 전에 생각하라

**가정하지 말고, 혼란을 숨기지 말고, 트레이드오프를 드러내라.**

구현하기 전에:

- 가정을 명시적으로 밝힌다. 불확실하면 묻는다.
- 해석이 여러 가지면 모두 제시한다 — 말없이 하나를 고르지 않는다.
- 더 단순한 방법이 있으면 말한다. 필요하면 반대 의견을 낸다.
- 불분명하면 멈춘다. 무엇이 혼란스러운지 짚고, 묻는다.

### 2. 단순함을 우선하라

**문제를 푸는 최소한의 코드만. 추측성 코드는 없다.**

- 요청받지 않은 기능은 만들지 않는다.
- 한 번만 쓰는 코드에 추상화를 만들지 않는다.
- 요청되지 않은 "유연성"이나 "설정 가능성"을 넣지 않는다.
- 일어날 수 없는 상황에 대한 에러 처리를 넣지 않는다.
- 200줄을 썼는데 50줄로 될 일이면, 다시 쓴다.

스스로에게 물어라: "시니어 엔지니어가 이걸 보면 과하게 복잡하다고 할까?" 그렇다면 단순화하라.

### 3. 외과적으로 변경하라

**꼭 필요한 곳만 건드린다. 네가 만든 흔적만 정리한다.**

기존 코드를 수정할 때:

- 인접한 코드·주석·포매팅을 "개선"하지 않는다.
- 망가지지 않은 것을 리팩터링하지 않는다.
- 다르게 하고 싶더라도 기존 스타일을 따른다.
- 관련 없는 죽은 코드를 발견하면 — 삭제하지 말고 언급한다.

네 변경이 고아(orphan) 코드를 만들면:

- 네 변경으로 인해 쓰이지 않게 된 import·변수·함수를 제거한다.
- 기존에 있던 죽은 코드는 요청받지 않는 한 제거하지 않는다.

기준: 변경한 모든 줄은 사용자의 요청과 직접 연결되어야 한다.

### 4. 목표 기반 실행

**성공 기준을 정의하라. 검증될 때까지 반복하라.**

작업을 검증 가능한 목표로 바꿔라:

- "검증 추가" → "잘못된 입력에 대한 테스트를 작성하고, 통과시킨다"
- "버그 수정" → "버그를 재현하는 테스트를 작성하고, 통과시킨다"
- "X 리팩터링" → "리팩터링 전후로 테스트가 통과하는지 확인한다"

여러 단계로 이뤄진 작업은 간단한 계획을 제시하라:

```
1. [단계] → 검증: [확인 방법]
2. [단계] → 검증: [확인 방법]
3. [단계] → 검증: [확인 방법]
```

강한 성공 기준은 독립적으로 반복 수행할 수 있게 한다. 약한 기준("그냥 되게 해")은 계속 확인을 요구한다.

---

**이 지침이 효과를 내고 있다는 신호:** diff에 불필요한 변경이 줄고, 과한 구현으로 인한 재작업이 줄고, 명확화 질문이 실수가 난 뒤가 아니라 구현하기 전에 나온다.
