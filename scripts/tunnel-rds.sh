#!/bin/bash
# dev RDS 로 SSH 터널 열기 (Bastion 경유)
# 사용법: ./scripts/tunnel-rds.sh dev [local_port]     (기본 15442)
#
# 사전 준비 (최초 1회)
#   1. apps/server/.env.dev 에 RDS_ENDPOINT 채우기
#   2. ~/.ssh/config 에 Bastion 등록:
#        Host bastion-weekly-report-dev
#          HostName <deploy:dev:bastion Outputs 의 BastionPublicIp>
#          User ec2-user
#          IdentityFile ~/.ssh/weekly-report-dev-bastion.pem
#   3. 개인키 내려받기 (Outputs 의 BastionKeyParameter):
#        aws ssm get-parameter --with-decryption --name <BastionKeyParameter> \
#          --query Parameter.Value --output text --profile weekly-report-dev \
#          > ~/.ssh/weekly-report-dev-bastion.pem && chmod 600 ~/.ssh/weekly-report-dev-bastion.pem
#   4. apps/server/cdk.json 의 sshAllowedCidrs 에 내 공인 IP(/32) 추가 후 deploy:dev:bastion

set -euo pipefail

STAGE="${1:-}"
if [ "$STAGE" != "dev" ]; then
  echo "사용법: $0 dev [local_port]"
  exit 1
fi

ENV_FILE="$(cd "$(dirname "$0")/../apps/server" && pwd)/.env.${STAGE}"
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE 이 없습니다. .env.${STAGE}.example 을 복사해 값을 채우세요."
  exit 1
fi

RDS_HOST="$(grep -E '^RDS_ENDPOINT=' "$ENV_FILE" | cut -d= -f2-)"
LOCAL_PORT="${2:-$(grep -E '^RDS_LOCAL_PORT=' "$ENV_FILE" | cut -d= -f2- || true)}"
LOCAL_PORT="${LOCAL_PORT:-15442}"
BASTION="bastion-weekly-report-${STAGE}"

if [ -z "$RDS_HOST" ] || [[ "$RDS_HOST" == *xxxxxxxx* ]]; then
  echo "ERROR: $ENV_FILE 의 RDS_ENDPOINT 를 실제 값으로 채우세요."
  exit 1
fi

echo "=== RDS SSH 터널 [${STAGE}] ==="
echo "  로컬:  localhost:${LOCAL_PORT}"
echo "  대상:  ${RDS_HOST}:5432"
echo "  경유:  ${BASTION} (~/.ssh/config)"
echo "  종료:  Ctrl+C"
echo ""

ssh -N -o ExitOnForwardFailure=yes -L "${LOCAL_PORT}:${RDS_HOST}:5432" "${BASTION}"
