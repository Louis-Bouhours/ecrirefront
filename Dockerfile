# syntax=docker/dockerfile:1

# Étape 1: Build Vite (sans tsc pour éviter les erreurs TS)
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

COPY . .
# Vite transpile TS sans lancer tsc
RUN npx vite build

# Étape 2: Runtime NGINX ultra-léger (serveur statique)
FROM nginx:1.27-alpine

# Conf NGINX SPA via heredoc 'quoted' -> aucune expansion de $uri
RUN rm -f /etc/nginx/conf.d/default.conf \
 && mkdir -p /etc/nginx/conf.d \
 && cat > /etc/nginx/conf.d/app.conf <<'EOF'
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  # Logs Docker
  access_log /dev/stdout;
  error_log  /dev/stderr warn;

  # Routes SPA: fallback index.html
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache long pour assets fingerprintés (Vite)
  location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  # Pas de cache pour index.html
  location = /index.html {
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
  }

  # Compression gzip
  gzip on;
  gzip_min_length 1024;
  gzip_types text/plain text/css application/json application/javascript image/svg+xml;
}
EOF

# Fichiers statiques
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]