#!/bin/sh
set -eu

APP_DOMAIN=${APP_DOMAIN:-localhost}
if [ "$APP_DOMAIN" = localhost ]; then
    echo "Certbot no solicita certificados para localhost"
    while :; do sleep 86400; done
fi
if [ -z "${CERTBOT_EMAIL:-}" ]; then
    echo "Falta CERTBOT_EMAIL para solicitar el certificado HTTPS" >&2
    exit 1
fi

while :; do
    if [ -f "/etc/letsencrypt/live/$APP_DOMAIN/fullchain.pem" ] && [ -f "/etc/letsencrypt/live/$APP_DOMAIN/privkey.pem" ]; then
        if certbot renew --cert-name "$APP_DOMAIN" --non-interactive; then
            sleep 43200
        else
            echo "Fallo la renovacion de $APP_DOMAIN; se volvera a intentar" >&2
            sleep 3600
        fi
    else
        if certbot certonly --webroot --webroot-path /var/www/certbot \
            --non-interactive --agree-tos --email "$CERTBOT_EMAIL" \
            --cert-name "$APP_DOMAIN" -d "$APP_DOMAIN"; then
            sleep 43200
        else
            echo "Fallo la emision de $APP_DOMAIN; se volvera a intentar" >&2
            sleep 3600
        fi
    fi
done
