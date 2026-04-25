#!/bin/sh
set -e

API_URL="${API_URL:-http://localhost:3000}"

cat > /usr/share/nginx/html/assets/config.json <<EOF
{
    "apiUrl": "${API_URL}"
}
EOF

echo "Config generada: apiUrl=${API_URL}"
exec nginx -g 'daemon off;'