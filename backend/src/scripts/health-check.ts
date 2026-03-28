/**
 * EcommFast — PostgreSQL Health Check Agent
 * Verifica si la instancia local de PostgreSQL está activa.
 * Si no lo está, muestra instrucciones específicas para WSL2 / Linux / macOS.
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { Pool } from 'pg';

// Carga .env o .env.local automáticamente (sin dotenv como dependencia)
const root = resolve(__dirname, '../..');
const envFile = ['.env', '.env.local'].map((f) => resolve(root, f)).find(existsSync);
if (envFile) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

const RESET  = '\x1b[0m';
const RED    = '\x1b[31m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';

function log(color: string, symbol: string, msg: string) {
  console.log(`${color}${BOLD}${symbol}${RESET} ${msg}`);
}

function detectPlatform(): 'wsl2' | 'linux' | 'macos' | 'unknown' {
  try {
    const uname = execSync('uname -r', { encoding: 'utf8' }).toLowerCase();
    if (uname.includes('microsoft') || uname.includes('wsl')) return 'wsl2';
    const os = execSync('uname -s', { encoding: 'utf8' }).trim().toLowerCase();
    if (os === 'darwin') return 'macos';
    if (os === 'linux') return 'linux';
  } catch {
    // ignore
  }
  return 'unknown';
}

function isPostgresProcessRunning(): boolean {
  try {
    const result = execSync('pg_isready -h 127.0.0.1 -p 5432 2>&1', { encoding: 'utf8' });
    return result.includes('accepting connections');
  } catch {
    return false;
  }
}

function printStartInstructions(platform: ReturnType<typeof detectPlatform>) {
  console.log('');
  log(YELLOW, '⚠', `${BOLD}PostgreSQL no está corriendo. Instrucciones de arranque:${RESET}`);
  console.log('');

  if (platform === 'wsl2') {
    console.log(`${CYAN}${BOLD}── WSL2 (Ubuntu/Debian) ──────────────────────────────────────${RESET}`);
    console.log(`${YELLOW}  ℹ  WSL2 no usa systemd por defecto. Usa el binario directo:${RESET}`);
    console.log('');
    console.log('  # Iniciar PostgreSQL:');
    console.log(`  ${BOLD}sudo service postgresql start${RESET}`);
    console.log('');
    console.log('  # Verificar estado:');
    console.log(`  ${BOLD}sudo service postgresql status${RESET}`);
    console.log('');
    console.log('  # Si PostgreSQL no está instalado:');
    console.log(`  ${BOLD}sudo apt update && sudo apt install -y postgresql postgresql-contrib${RESET}`);
    console.log('');
    console.log('  # Crear usuario y DB después de instalar:');
    console.log(`  ${BOLD}sudo -u postgres psql -c "CREATE USER ecommfast_user WITH PASSWORD 'ecommfast_secret';"${RESET}`);
    console.log(`  ${BOLD}sudo -u postgres psql -c "CREATE DATABASE ecommfast OWNER ecommfast_user;"${RESET}`);
    console.log(`  ${BOLD}sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ecommfast TO ecommfast_user;"${RESET}`);

  } else if (platform === 'linux') {
    console.log(`${CYAN}${BOLD}── Linux (systemd) ───────────────────────────────────────────${RESET}`);
    console.log(`  ${BOLD}sudo systemctl start postgresql${RESET}`);
    console.log(`  ${BOLD}sudo systemctl enable postgresql   # auto-arranque${RESET}`);

  } else if (platform === 'macos') {
    console.log(`${CYAN}${BOLD}── macOS (Homebrew) ──────────────────────────────────────────${RESET}`);
    console.log(`  ${BOLD}brew services start postgresql@15${RESET}`);

  } else {
    console.log(`  Inicia el servicio de PostgreSQL manualmente en tu sistema operativo.`);
  }

  console.log('');
  console.log(`  Luego ejecuta de nuevo: ${BOLD}npm run health-check${RESET}`);
  console.log('');
}

async function checkDbConnection(connectionString: string): Promise<boolean> {
  const pool = new Pool({ connectionString, connectionTimeoutMillis: 3000 });
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch {
    return false;
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('');
  console.log(`${CYAN}${BOLD}╔══════════════════════════════════════════════╗${RESET}`);
  console.log(`${CYAN}${BOLD}║   EcommFast — PostgreSQL Health Check Agent  ║${RESET}`);
  console.log(`${CYAN}${BOLD}╚══════════════════════════════════════════════╝${RESET}`);
  console.log('');

  const platform = detectPlatform();
  log(CYAN, '🔍', `Plataforma detectada: ${BOLD}${platform.toUpperCase()}${RESET}`);

  // 1. Check if pg_isready binary exists
  const hasPgReady = (() => {
    try { execSync('which pg_isready', { stdio: 'ignore' }); return true; }
    catch { return false; }
  })();

  if (!hasPgReady) {
    log(RED, '✗', `${BOLD}pg_isready no encontrado${RESET} — PostgreSQL no está instalado.`);
    printStartInstructions(platform);
    process.exit(1);
  }

  // 2. Check if Postgres is accepting connections
  const isRunning = isPostgresProcessRunning();

  if (!isRunning) {
    log(RED, '✗', 'PostgreSQL no está aceptando conexiones en 127.0.0.1:5432');
    printStartInstructions(platform);
    process.exit(1);
  }

  log(GREEN, '✓', 'PostgreSQL está activo en 127.0.0.1:5432');

  // 3. Check application DB connection
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    log(YELLOW, '⚠', 'DATABASE_URL no definida — omitiendo prueba de conexión a ecommfast DB');
    process.exit(0);
  }

  log(CYAN, '🔗', `Probando conexión a: ${dbUrl.replace(/:([^:@]+)@/, ':****@')}`);

  const connected = await checkDbConnection(dbUrl);
  if (!connected) {
    log(RED, '✗', 'No se pudo conectar a la base de datos. Verifica usuario, contraseña y que la DB exista.');
    console.log('');
    console.log(`  Ejecuta para crear la DB si no existe:`);
    console.log(`  ${BOLD}sudo -u postgres psql -c "CREATE DATABASE ecommfast OWNER ecommfast_user;"${RESET}`);
    console.log('');
    process.exit(1);
  }

  log(GREEN, '✓', `Conexión exitosa a la base de datos ${BOLD}ecommfast${RESET}`);

  // 4. Check migrations table
  const pool = new Pool({ connectionString: dbUrl, connectionTimeoutMillis: 3000 });
  try {
    const client = await pool.connect();
    const { rows } = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_name = '_migrations'`
    );
    const migrated = parseInt(rows[0].count, 10) > 0;

    if (migrated) {
      const { rows: mRows } = await client.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM _migrations`
      );
      log(GREEN, '✓', `Migraciones aplicadas: ${BOLD}${mRows[0].count}${RESET}`);
    } else {
      log(YELLOW, '⚠', `Tabla _migrations no encontrada. Ejecuta: ${BOLD}npm run migrate${RESET}`);
    }

    client.release();
  } finally {
    await pool.end();
  }

  console.log('');
  log(GREEN, '🚀', `${BOLD}Sistema listo. Puedes iniciar el servidor: npm run dev${RESET}`);
  console.log('');
}

main().catch((err) => {
  log(RED, '✗', `Error inesperado: ${err.message}`);
  process.exit(1);
});
