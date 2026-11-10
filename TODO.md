# TODO

## 클라우드 (AWS 계정 생성 후)

코드는 준비됨 — Lambda 핸들러, webpack 번들, CDK(dev: VPC+NAT / RDS / Bastion / API Gateway+Lambda). 배포는 아직 한 번도 안 함.

- [ ] AWS 계정 + CLI 프로필 `weekly-report-dev` 생성, `apps/server/cdk.json` 의 `account`, `sshAllowedCidrs` 채우기
- [ ] 최초 배포 (`apps/server/CLAUDE.md` 의 "최초 배포 순서") — 첫 배포에서 실제 AWS 동작 확인 필요 (지금까지는 synth + 로컬 핸들러 호출로만 검증)
- [ ] 프론트 배포 (Vercel 또는 S3+CloudFront), `NEXT_PUBLIC_API_URL` 설정, `corsOrigins` 에 프론트 주소 추가
- [ ] 커스텀 도메인 + ACM 인증서 (도메인이 정해지면)
- [ ] GitHub Actions OIDC 자동 배포 (main → dev API) — git 저장소/GitHub repo 생성 후
- [ ] prd 환경이 필요해지면 `cdk.json` 에 prd 블록 추가

## 기능

- [ ] 두 앱에 복사돼 있는 공용 UI(`shared/ui`, 토큰)를 `packages/ui` 로 합치기

- [ ] 요구사항 문서의 "확인이 필요한 가정" 결정 반영
- [ ] 미제출자 리마인드 (메일 발송 — AWS SES 등 계정 생성 후)
- [ ] 프론트 MSW mock 모드 (ygpa-pms 방식) — 필요 시
