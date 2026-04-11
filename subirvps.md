# Guía: Despliegue de EcommFast en VPS con Docker

## Arquitectura de contenedores

```
Internet
   │
   ▼
┌──────────────────────────────────────────────────────────┐
│  VPS (Ubuntu 24.04 LTS)                                  │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Docker Network: ecommfast_net                      │ │
│  │                                                     │ │
│  │  ┌────────────────┐   /api/*  ┌─────────────────┐  │ │
│  │  │  frontend:80   │ ────────► │  backend:3001   │  │ │
│  │  │  (Nginx+React) │          │  (Node/Express) │  │ │
│  │  └────────────────┘          └────────┬────────┘  │ │
│  │        ▲ Puerto 80 expuesto           │            │ │
│  │        │ al host                      ▼            │ │
│  │        │                    ┌─────────────────┐    │ │
│  │        │                    │  postgres:5432  │    │ │
│  │        │                    │  (PostgreSQL 15)│    │ │
│  │        │                    └─────────────────┘    │ │
│  └────────┼────────────────────────────────────────── ┘ │
│           │ :80                                          │
└───────────┼──────────────────────────────────────────────┘
            │
         Usuarios
```

---

## Requisitos del VPS

- Ubuntu 24.04 LTS (Noble Numbat) ✓ — versión verificada
- Docker 29.4.0+ con Compose V2 integrado ✓ — versión verificada
- 1 GB RAM mínimo (2 GB recomendado)
- 20 GB disco
- Puerto 80 (y 443 si usarás HTTPS) abiertos en el firewall

---

## PASO 1 — Conectarse al VPS

```bash
ssh usuario@IP_DEL_VPS
```

---

## PASO 2 — Verificar Docker (ya instalado en tu VPS)

> Tu VPS ya tiene **Docker 29.4.0** instalado. Solo verifica que el usuario
> esté en el grupo `docker` para no necesitar `sudo` en cada comando.

```bash
# Verificar versiones
docker --version        # Docker version 29.4.0, build 9d7ad9f
docker compose version  # Docker Compose version v2.x.x

# Si los comandos docker requieren sudo, agregar tu usuario al grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

> **Nota — Instalación desde cero (VPS nuevo sin Docker):**
> Si necesitas instalar Docker en un VPS Ubuntu 24.04 limpio, usa el script
> oficial (compatible con Noble Numbat):
>
> ```bash
> sudo apt update && sudo apt install -y ca-certificates curl
> sudo install -m 0755 -d /etc/apt/keyrings
> sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
>   -o /etc/apt/keyrings/docker.asc
> sudo chmod a+r /etc/apt/keyrings/docker.asc
> echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
>   https://download.docker.com/linux/ubuntu \
>   $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
>   sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
> sudo apt update
> sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
> sudo usermod -aG docker $USER && newgrp docker
> ```
>
> ⚠️ Ubuntu 24.04 usa `.asc` (formato ASCII) en lugar de `.gpg` para el
> keyring — diferencia respecto a Ubuntu 22.04.

---

## PASO 3 — Subir el proyecto al VPS

### Opción A — Clonar desde Git (recomendado)

```bash
# En el VPS
git clone https://github.com/TU_USUARIO/ecommfast.git
cd ecommfast
```

### Opción B — Copiar archivos con SCP (desde tu máquina local)

```bash
# Ejecutar en tu máquina local
scp -r /home/jorger612/ecommfast usuario@IP_DEL_VPS:/home/usuario/ecommfast
```

### Opción C — rsync (más rápido para actualizaciones)

```bash
# Ejecutar en tu máquina local
rsync -avz --exclude='node_modules' --exclude='.env' \
  /home/jorger612/ecommfast/ usuario@IP_DEL_VPS:/home/usuario/ecommfast/
```

---

## PASO 4 — Configurar variables de entorno

```bash
# En el VPS, dentro de la carpeta del proyecto
cd /home/usuario/ecommfast

# Copiar el template
cp .env.prod.example .env.prod

# Editar con tus valores reales
nano .env.prod
```

### Valores obligatorios a cambiar en `.env.prod`:

| Variable | Descripción |
|----------|-------------|
| `POSTGRES_PASSWORD` | Password fuerte para PostgreSQL |
| `JWT_SECRET` | Mínimo 32 caracteres aleatorios |
| `JWT_REFRESH_SECRET` | Otro string de 32+ caracteres aleatorios |
| `CORS_ORIGIN` | URL de tu dominio: `https://tudominio.com` |

**Generar secrets seguros:**

```bash
# Genera un secret de 48 bytes en base64
openssl rand -base64 48
```

> ⚠️ **IMPORTANTE:** Los tres valores `POSTGRES_PASSWORD` deben ser idénticos
> en `POSTGRES_PASSWORD`, `DATABASE_URL` y el `DATABASE_URL` del backend.
> El template `.env.prod.example` ya los vincula automáticamente.

---

## PASO 5 — Construir y levantar los contenedores

> **Docker 29.x usa Compose V2** integrado: el comando es `docker compose`
> (sin guion). **No uses** `docker-compose` (v1, obsoleto y no disponible por defecto).

```bash
cd /home/usuario/ecommfast

# Construir imágenes y levantar en segundo plano
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Esto ejecuta en orden:
1. **PostgreSQL** — arranca y espera estar saludable
2. **Backend** — espera al DB, corre migraciones, inicia Express
3. **Frontend** — sirve React con Nginx en el puerto 80

---

## PASO 6 — Verificar que todo funciona

```bash
# Ver estado de los contenedores
docker compose --env-file .env.prod -f docker-compose.prod.yml ps

# Ver logs en tiempo real (todos los servicios)
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f

# Ver logs de un servicio específico
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f backend
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f postgres

# Verificar conectividad interna
docker exec ecommfast_backend wget -qO- http://localhost:3001/api/health || echo "Sin /health endpoint"
```

**La aplicación estará disponible en:** `http://IP_DEL_VPS`

---

## PASO 7 — (Opcional) Configurar dominio + HTTPS con Certbot

```bash
# Instalar Certbot
sudo apt install -y certbot

# Detener el contenedor frontend para liberar el puerto 80
docker compose --env-file .env.prod -f docker-compose.prod.yml stop frontend

# Obtener certificado SSL
sudo certbot certonly --standalone -d tudominio.com -d www.tudominio.com

# Los certificados quedan en:
# /etc/letsencrypt/live/tudominio.com/fullchain.pem
# /etc/letsencrypt/live/tudominio.com/privkey.pem
```

Luego edita `frontend/nginx.conf` para agregar el bloque HTTPS y redirigir HTTP → HTTPS,
y actualiza `docker-compose.prod.yml` para montar los certificados y exponer el puerto 443.

---

## PASO 8 — Proceso de actualización / redeploy

Cuando subas cambios al código:

```bash
cd /home/usuario/ecommfast

# Traer cambios (si usas Git)
git pull origin main

# Reconstruir imágenes y reiniciar (sin downtime en DB)
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build --no-deps backend frontend

# O reconstruir todo
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

---

## Comandos útiles de administración

```bash
# Detener todos los contenedores
docker compose --env-file .env.prod -f docker-compose.prod.yml down

# Detener y borrar volúmenes (⚠️ BORRA LA BASE DE DATOS)
docker compose --env-file .env.prod -f docker-compose.prod.yml down -v

# Reiniciar un servicio específico
docker compose --env-file .env.prod -f docker-compose.prod.yml restart backend

# Entrar al contenedor de backend
docker exec -it ecommfast_backend sh

# Entrar a la base de datos
docker exec -it ecommfast_db psql -U ecommfast_user -d ecommfast

# Ver uso de recursos
docker stats

# Limpiar imágenes no utilizadas
docker image prune -f
```

---

## Estructura de archivos generados

```
ecommfast/
├── docker-compose.prod.yml      ← Compose de producción
├── .env.prod.example            ← Template de variables (commitear)
├── .env.prod                    ← Variables reales (NO commitear)
├── subirvps.md                  ← Esta guía
│
├── backend/
│   ├── Dockerfile               ← Build multi-stage Node.js
│   ├── docker-entrypoint.sh     ← Corre migraciones + inicia servidor
│   └── .dockerignore
│
└── frontend/
    ├── Dockerfile               ← Build multi-stage React + Nginx
    ├── nginx.conf               ← Sirve SPA + proxy /api al backend
    └── .dockerignore
```

---

## Seguridad — Checklist antes de subir a producción

- [ ] `POSTGRES_PASSWORD` es un password fuerte (16+ chars, especiales)
- [ ] `JWT_SECRET` y `JWT_REFRESH_SECRET` tienen 32+ caracteres aleatorios
- [ ] `.env.prod` está en `.gitignore` y NO está en el repositorio
- [ ] El puerto de PostgreSQL (5432) NO está expuesto al host en `docker-compose.prod.yml`
- [ ] El puerto del backend (3001) NO está expuesto al host (solo via Nginx)
- [ ] El firewall del VPS solo permite puertos 22, 80 (y 443 si configuras SSL)
- [ ] `CORS_ORIGIN` apunta al dominio exacto de producción
