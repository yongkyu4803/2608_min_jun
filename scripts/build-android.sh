#!/usr/bin/env bash
# Capacitor Android 디버그 APK 빌드.
#
#   ./scripts/build-android.sh                       정적 번들 앱 (오프라인, 방문자 카운터 없음)
#   APP_URL=https://... ./scripts/build-android.sh   배포된 사이트를 불러오는 URL 래퍼 앱
#
# 선택 환경변수: APP_ID(패키지명), APP_NAME(앱 이름) — 기본값은 capacitor.config.ts 와 동일.
# google-services.json 의 package_name 과 APP_ID 가 같아야 푸시 알림이 동작한다.
#
# 서버 전용 API 라우트(src/app/api)는 static export 에 포함할 수 없어 빌드 동안만 치워 둔다.
# (방문 카운터는 API가 없으면 자동으로 숨겨진다.)
set -euo pipefail
cd "$(dirname "$0")/.."

API_DIR=src/app/api
GRADLE=android/app/build.gradle
STRINGS=android/app/src/main/res/values/strings.xml
STASH=$(mktemp -d)

# Capacitor 는 패키지명·앱 이름을 `cap add` 때 한 번만 android/ 에 기록한다.
# 빌드마다 바꿀 수 있도록 임시로 덮어쓰고, 끝나면 원래대로 되돌린다.
cp "$GRADLE" "$STASH/build.gradle"
cp "$STRINGS" "$STASH/strings.xml"
restore() {
  [ -d "$STASH/api" ] && mv "$STASH/api" "$API_DIR"
  cp "$STASH/build.gradle" "$GRADLE"
  cp "$STASH/strings.xml" "$STRINGS"
  rm -rf "$STASH"
}
trap restore EXIT

if [ -z "${APP_URL:-}" ]; then
  mv "$API_DIR" "$STASH/api"
  CAPACITOR_BUILD=1 npx next build
  [ -d "$STASH/api" ] && mv "$STASH/api" "$API_DIR"
fi

[ -d android ] || npx cap add android
npx cap sync android

if [ -n "${APP_ID:-}" ]; then
  sed -i "s/applicationId \"[^\"]*\"/applicationId \"$APP_ID\"/" "$GRADLE"
fi
if [ -n "${APP_NAME:-}" ]; then
  sed -i "s#<string name=\"app_name\">[^<]*</string>#<string name=\"app_name\">$APP_NAME</string>#" "$STRINGS"
  sed -i "s#<string name=\"title_activity_main\">[^<]*</string>#<string name=\"title_activity_main\">$APP_NAME</string>#" "$STRINGS"
fi

(cd android && ./gradlew assembleDebug)
echo "APK: android/app/build/outputs/apk/debug/app-debug.apk"
