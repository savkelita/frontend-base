#!/bin/sh
set -eu

# -------------------------------------------------------------------------------------
# Подизање инстанце
# -------------------------------------------------------------------------------------
#
# Исти артефакт, произвољан број инстанци. Разлика је само у ENVIRONMENT: он одређује
# префикс, а из префикса се изводе <base href>, config.json и nginx локације. Ништа од тога
# није у bundle-у, па нема поновног превођења по инстанци.
#
# Свака измена се и провери. Тихо прескочен sed значи да се апликација подигне и тражи
# ресурсе у корену — што се примети тек кад корисник пријави белу страницу.

fail() {
  echo "ERROR: $1" >&2
  exit 1
}

[ -n "${ENVIRONMENT:-}" ] || fail "ENVIRONMENT није постављен (пример: ENVIRONMENT=Magacin1)"
[ -d /frontend-src ] || fail "/frontend-src није монтиран — недостаје артефакт фронтенда"

JAVA_UPSTREAM="${JAVA_UPSTREAM:-java-backend:8080}"
DOTNET_UPSTREAM="${DOTNET_UPSTREAM:-dotnet-backend:5000}"

# Нормализација: водећа коса црта, без завршне. Корен даје празан низ, па се локације
# у шаблону своде на `/`, `/api/`, `/net/`.
BASE_PATH="/${ENVIRONMENT#/}"
BASE_PATH="${BASE_PATH%/}"
[ "$BASE_PATH" = "/" ] && BASE_PATH=""

echo "Префикс: '${BASE_PATH:-/}'   Java: ${JAVA_UPSTREAM}   .NET: ${DOTNET_UPSTREAM}"

ROOT=/usr/share/nginx/html/frontend
mkdir -p "$ROOT"
rm -rf "${ROOT:?}/"*
cp -R /frontend-src/. "$ROOT/"

# 1. <base href> — из њега webpack изводи путању до bundle-а (publicPath: 'auto').
INDEX="$ROOT/index.html"
[ -f "$INDEX" ] || fail "index.html не постоји у артефакту"
sed -i "s|<base href=\"/\">|<base href=\"${BASE_PATH}/\">|g" "$INDEX"
grep -q "<base href=\"${BASE_PATH}/\">" "$INDEX" || fail "<base href> није измењен у ${INDEX}"

# 2. config.json — једино место одакле апликација сазнаје свој префикс.
CONFIG="$ROOT/config.json"
[ -f "$CONFIG" ] || fail "config.json не постоји у артефакту"
sed -i "s|\"basePath\"[[:space:]]*:[[:space:]]*\"[^\"]*\"|\"basePath\": \"${BASE_PATH:-/}\"|g" "$CONFIG"
sed -i "s|\"apiUrl\"[[:space:]]*:[[:space:]]*\"[^\"]*\"|\"apiUrl\": \"${BASE_PATH}\"|g" "$CONFIG"
grep -q "\"basePath\": \"${BASE_PATH:-/}\"" "$CONFIG" || fail "basePath није измењен у ${CONFIG}"
[ -n "${PISMO:-}" ] && sed -i "s|\"pismo\"[[:space:]]*:[[:space:]]*\"[^\"]*\"|\"pismo\": \"${PISMO}\"|g" "$CONFIG"

# 3. nginx локације и upstream-ови.
mkdir -p /etc/nginx/conf.d
sed -e "s|__BASE_PATH__|${BASE_PATH}|g" \
    -e "s|__JAVA_UPSTREAM__|${JAVA_UPSTREAM}|g" \
    -e "s|__DOTNET_UPSTREAM__|${DOTNET_UPSTREAM}|g" \
    /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
sed "s|__BASE_PATH__|${BASE_PATH}|g" /etc/nginx/templates/proxy-common.conf > /etc/nginx/proxy-common.conf

nginx -t || fail "nginx конфигурација није исправна"

echo "Подигнуто."
exec nginx -g 'daemon off;'
