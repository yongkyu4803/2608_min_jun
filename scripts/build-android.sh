#!/usr/bin/env bash
# 정적 번들 → Capacitor Android 디버그 APK
# 서버 전용 API 라우트(src/app/api)는 static export에 포함할 수 없어 빌드 동안만 치워 둔다.
# (방문 카운터는 API가 없으면 자동으로 숨겨진다.)
set -euo pipefail
cd "$(dirname "$0")/.."

API_DIR=src/app/api
STASH=$(mktemp -d)
restore() { [ -d "$STASH/api" ] && mv "$STASH/api" "$API_DIR"; rm -rf "$STASH"; }
trap restore EXIT

mv "$API_DIR" "$STASH/api"
CAPACITOR_BUILD=1 npx next build
restore; trap - EXIT

[ -d android ] || npx cap add android
npx cap sync android
(cd android && ./gradlew assembleDebug)
echo "APK: android/app/build/outputs/apk/debug/app-debug.apk"
