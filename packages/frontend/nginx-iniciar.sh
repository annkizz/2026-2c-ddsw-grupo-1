#!/bin/sh
set -eu

APP_DOMAIN=${APP_DOMAIN:-localhost}
export APP_DOMAIN
if [ "$APP_DOMAIN" != localhost ]; then
    case "$APP_DOMAIN" in
        *[!a-z0-9.-]*)
            echo "APP_DOMAIN debe ser un dominio DNS en minusculas, sin protocolo ni rutas" >&2
            exit 1
            ;;
    esac
    if [ "${#APP_DOMAIN}" -gt 253 ] || ! printf '%s\n' "$APP_DOMAIN" | grep -Eq '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'; then
        echo "APP_DOMAIN debe ser un dominio DNS en minusculas, sin protocolo ni rutas" >&2
        exit 1
    fi
fi

envsubst '${APP_DOMAIN}' < /opt/nginx/nginx.conf > /etc/nginx/conf.d/default.conf
rm -f /etc/nginx/conf.d/tls.conf
if [ -f "/etc/letsencrypt/live/$APP_DOMAIN/fullchain.pem" ] && [ -f "/etc/letsencrypt/live/$APP_DOMAIN/privkey.pem" ]; then
    envsubst '${APP_DOMAIN}' < /opt/nginx/nginx-tls.conf > /etc/nginx/conf.d/tls.conf
fi

if [ "$APP_DOMAIN" != localhost ]; then
    /bin/sh /opt/nginx/certificados.sh &
fi
