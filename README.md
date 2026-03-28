# EcommFast

Plataforma de comercio electrónico con React (Vite) + Tailwind CSS | Node.js (Express + TypeScript) | PostgreSQL.

---

## Requisitos previos

| Herramienta | Versión mínima |
|-------------|----------------|
| Node.js     | 20 LTS         |
| npm         | 10+            |
| PostgreSQL  | 15+            |

> **Docker ya no es requerido.** El proyecto usa PostgreSQL nativo instalado en el host.

---

## Instalación de PostgreSQL (WSL2 / Ubuntu)

Si estás en **WSL2** (entorno detectado en este proyecto):

```bash
# 1. Instalar PostgreSQL
sudo apt update && sudo apt install -y postgresql postgresql-contrib

# 2. Iniciar el servicio (WSL2 no usa systemd — usa service)
sudo service postgresql start

# 3. Verificar que esté activo
sudo service postgresql status
# debe mostrar: "online"
```

### Crear usuario y base de datos

```bash
sudo -u postgres psql -c "CREATE USER ecommfast_user WITH PASSWORD 'ecommfast_secret';"
sudo -u postgres psql -c "CREATE DATABASE ecommfast OWNER ecommfast_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ecommfast TO ecommfast_user;"
```

> O usa el script automatizado: `npm run setup-db` desde `backend/`.

---

## Configuración del entorno

```bash
cd backend
cp .env.local .env   # ya configurado para PostgreSQL local
# Edita JWT_SECRET y JWT_REFRESH_SECRET con strings aleatorios de 32+ chars
```

El archivo `.env.local` contiene:

```
DATABASE_URL=postgresql://ecommfast_user:ecommfast_secret@127.0.0.1:5432/ecommfast
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=ecommfast
DB_USER=ecommfast_user
DB_PASSWORD=ecommfast_secret
```

---

## Levantar el proyecto

### Backend

```bash
cd backend
npm install

# Opción A — Setup completo (DB + migraciones + servidor)
npm run setup-db     # crea usuario/DB y ejecuta las 11 migraciones
npm run dev          # verifica DB y arranca en http://localhost:3001

# Opción B — Solo migraciones (si la DB ya existe)
npm run migrate
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

---

## Scripts disponibles (backend)

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Verifica DB + inicia servidor en modo desarrollo (hot reload) |
| `npm run dev:fast` | Inicia servidor sin verificar DB (para desarrollo rápido) |
| `npm run health-check` | **Health Check Agent** — verifica PostgreSQL y conexión a DB |
| `npm run setup-db` | Crea usuario/DB local y ejecuta migraciones automáticamente |
| `npm run migrate` | Ejecuta migraciones pendientes |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm run test` | Ejecuta suite de tests |

---

## Health Check Agent

El agente de monitoreo (`npm run health-check`) realiza tres verificaciones:

1. **Binario pg_isready** — detecta si PostgreSQL está instalado
2. **Conexión 127.0.0.1:5432** — verifica que el servicio esté activo
3. **Conexión a la DB `ecommfast`** — valida credenciales y existencia de la DB
4. **Estado de migraciones** — reporta cuántas migraciones han sido aplicadas

Si alguna verificación falla, muestra instrucciones específicas para **WSL2**, Linux o macOS.

```
╔══════════════════════════════════════════════╗
║   EcommFast — PostgreSQL Health Check Agent  ║
╚══════════════════════════════════════════════╝

🔍 Plataforma detectada: WSL2
✓  PostgreSQL está activo en 127.0.0.1:5432
🔗 Probando conexión a: postgresql://ecommfast_user:****@127.0.0.1:5432/ecommfast
✓  Conexión exitosa a la base de datos ecommfast
✓  Migraciones aplicadas: 11
🚀 Sistema listo. Puedes iniciar el servidor: npm run dev
```

---

## Troubleshooting

### PostgreSQL no arranca en WSL2

```bash
# Ver logs de error
sudo cat /var/log/postgresql/postgresql-15-main.log | tail -20

# Reiniciar servicio
sudo service postgresql restart

# Si el puerto 5432 está ocupado
sudo lsof -i :5432
```

### Error "role ecommfast_user does not exist"

```bash
sudo -u postgres psql -c "CREATE USER ecommfast_user WITH PASSWORD 'ecommfast_secret';"
```

### Error "database ecommfast does not exist"

```bash
sudo -u postgres psql -c "CREATE DATABASE ecommfast OWNER ecommfast_user;"
```
