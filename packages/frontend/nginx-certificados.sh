#!/bin/sh
set -eu

certificado="/etc/letsencrypt/live/$APP_DOMAIN/fullchain.pem"
clave="/etc/letsencrypt/live/$APP_DOMAIN/privkey.pem"
anterior=""

while sleep 30; do
    if [ ! -f "$certificado" ] || [ ! -f "$clave" ]; then
        continue
    fi
    actual=$(sha256sum "$certificado" "$clave" | sha256sum)
    if [ "$actual" = "$anterior" ]; then
        continue
    fi
    envsubst '${APP_DOMAIN}' < /opt/nginx/nginx-tls.conf > /etc/nginx/conf.d/tls.conf
    if nginx -t && nginx -s reload; then
        echo "Nginx cargo el certificado de $APP_DOMAIN"
        anterior=$actual
    else
        echo "No se pudo cargar el certificado de $APP_DOMAIN; se volvera a intentar" >&2
    fi
done
