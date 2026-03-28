/**
 * EcommFast — Database Seeder
 * QA / Datos de prueba realistas para validar flujos de ecommerce.
 * Uso: npm run db:seed
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { Pool } from 'pg';

// Carga .env / .env.local sin dotenv
const root = resolve(__dirname, '..');
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

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('ERROR: DATABASE_URL no definida.'); process.exit(1); }

const pool = new Pool({ connectionString: DATABASE_URL });

// ─── Helpers ──────────────────────────────────────────────────────────────────
const RESET = '\x1b[0m'; const GREEN = '\x1b[32m'; const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m'; const BOLD = '\x1b[1m'; const RED = '\x1b[31m';
const ok  = (msg: string) => console.log(`${GREEN}✓${RESET}  ${msg}`);
const inf = (msg: string) => console.log(`${CYAN}→${RESET}  ${msg}`);
const warn = (msg: string) => console.log(`${YELLOW}⚠${RESET}  ${msg}`);

// ─── Seed Data ────────────────────────────────────────────────────────────────

interface CategorySeed {
  name: string; slug: string; description: string; sort_order: number;
}

const CATEGORIES: CategorySeed[] = [
  { name: 'Electrónica',  slug: 'electronica', description: 'Gadgets, dispositivos y tecnología de última generación.', sort_order: 1 },
  { name: 'Ropa',         slug: 'ropa',        description: 'Moda casual, deportiva y formal para toda ocasión.', sort_order: 2 },
  { name: 'Hogar',        slug: 'hogar',       description: 'Todo lo que necesitas para decorar y equipar tu hogar.', sort_order: 3 },
  { name: 'Accesorios',   slug: 'accesorios',  description: 'Complementa tu estilo con bolsos, relojes y más.', sort_order: 4 },
  { name: 'Deportes',     slug: 'deportes',    description: 'Equipamiento y ropa para mantenerte activo.', sort_order: 5 },
];

interface ProductSeed {
  category_slug: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  photos: string[];
  sort_order: number;
}

const placeholder = (w: number, h: number, text: string) =>
  `https://placehold.co/${w}x${h}/e0e7ff/4f46e5?text=${encodeURIComponent(text)}`;

const PRODUCTS: ProductSeed[] = [
  // ── Electrónica (5 productos) ────────────────────────────────────────────
  {
    category_slug: 'electronica',
    name: 'Auriculares Inalámbricos ProSound X1',
    slug: 'auriculares-inalambricos-prosound-x1',
    description: 'Auriculares Bluetooth 5.3 con cancelación activa de ruido, 30 horas de batería y drivers de 40mm para un sonido envolvente. Ideales para trabajo remoto y viajes.',
    price: 1299.99,
    stock: 45,
    photos: [
      placeholder(600, 600, 'ProSound+X1'),
      placeholder(600, 600, 'ProSound+X1+Side'),
    ],
    sort_order: 1,
  },
  {
    category_slug: 'electronica',
    name: 'Smartwatch FitTrack Pro',
    slug: 'smartwatch-fittrack-pro',
    description: 'Reloj inteligente con monitor cardíaco continuo, GPS integrado, resistencia al agua 5ATM y pantalla AMOLED de 1.4". Compatible con iOS y Android.',
    price: 2499.00,
    stock: 28,
    photos: [placeholder(600, 600, 'FitTrack+Pro')],
    sort_order: 2,
  },
  {
    category_slug: 'electronica',
    name: 'Teclado Mecánico TechType K80',
    slug: 'teclado-mecanico-techtype-k80',
    description: 'Teclado mecánico TKL con switches Cherry MX Red, retroiluminación RGB por tecla y construcción en aluminio anodizado. Para gamers y profesionales.',
    price: 1850.50,
    stock: 60,
    photos: [
      placeholder(600, 600, 'TechType+K80'),
      placeholder(600, 600, 'K80+RGB'),
    ],
    sort_order: 3,
  },
  {
    category_slug: 'electronica',
    name: 'Cámara Web HD StreamCam 4K',
    slug: 'camara-web-hd-streamcam-4k',
    description: 'Cámara web 4K con autofoco dual, micrófono omnidireccional con reducción de ruido y corrección de luz automática. Perfecta para streaming y videollamadas.',
    price: 3200.00,
    stock: 0, // ← Sin stock — valida restricción de inventario
    photos: [placeholder(600, 600, 'StreamCam+4K')],
    sort_order: 4,
  },
  {
    category_slug: 'electronica',
    name: 'Bocina Portátil BassBlast Mini',
    slug: 'bocina-portatil-bassblast-mini',
    description: 'Bocina Bluetooth resistente al agua IPX7 con 20W de potencia, sonido 360° y batería de 16 horas. Tu compañera ideal para exteriores.',
    price: 899.99,
    stock: 112,
    photos: [placeholder(600, 600, 'BassBlast+Mini')],
    sort_order: 5,
  },

  // ── Ropa (5 productos) ───────────────────────────────────────────────────
  {
    category_slug: 'ropa',
    name: 'Playera Premium SoftCotton Blanca',
    slug: 'playera-premium-softcotton-blanca',
    description: 'Playera de algodón pima 180g/m² con corte slim fit y cuello redondo reforzado. Disponible en tallas XS-XXL. Lavable a máquina sin deformación.',
    price: 299.00,
    stock: 200,
    photos: [
      placeholder(600, 600, 'SoftCotton+Blanca'),
      placeholder(600, 600, 'SoftCotton+Back'),
    ],
    sort_order: 1,
  },
  {
    category_slug: 'ropa',
    name: 'Jeans Slim Denim Classic',
    slug: 'jeans-slim-denim-classic',
    description: 'Jeans de mezclilla stretch 98% algodón / 2% elastano. Corte slim que combina comodidad y estilo. Cierre de metal robusto y 5 bolsillos funcionales.',
    price: 749.50,
    stock: 85,
    photos: [placeholder(600, 600, 'Denim+Classic')],
    sort_order: 2,
  },
  {
    category_slug: 'ropa',
    name: 'Hoodie UrbanFlex Gris',
    slug: 'hoodie-urbanflex-gris',
    description: 'Sudadera con capucha de French Terry 320g/m², bolsillo canguro y puños con canalé. Corte oversize moderno. Perfecta para el día a día urbano.',
    price: 599.99,
    stock: 0, // ← Sin stock — valida restricción de inventario
    photos: [placeholder(600, 600, 'UrbanFlex+Gris')],
    sort_order: 3,
  },
  {
    category_slug: 'ropa',
    name: 'Chaqueta Bomber AeroShell Navy',
    slug: 'chaqueta-bomber-aeroshell-navy',
    description: 'Chaqueta bomber con forro de satén, puños y cintura acanalados y cierre YKK. Material exterior repelente al agua. Estilo retro con funcionalidad moderna.',
    price: 1450.00,
    stock: 30,
    photos: [
      placeholder(600, 600, 'AeroShell+Navy'),
      placeholder(600, 600, 'AeroShell+Detail'),
    ],
    sort_order: 4,
  },
  {
    category_slug: 'ropa',
    name: 'Vestido Lino Natural SunDress',
    slug: 'vestido-lino-natural-sundress',
    description: 'Vestido midi de lino 100% natural, transpirable y fresco para climas cálidos. Escote en V, mangas cortas y falda amplia. Disponible en beige, blanco y coral.',
    price: 850.00,
    stock: 42,
    photos: [placeholder(600, 600, 'SunDress+Lino')],
    sort_order: 5,
  },

  // ── Hogar (5 productos) ──────────────────────────────────────────────────
  {
    category_slug: 'hogar',
    name: 'Lámpara de Mesa ArcLight Pro',
    slug: 'lampara-de-mesa-arclight-pro',
    description: 'Lámpara LED de escritorio con brazo articulado, 5 niveles de brillo, temperatura de color ajustable (3000K-6500K) y puerto USB-C de carga. Base antideslizante.',
    price: 680.00,
    stock: 75,
    photos: [placeholder(600, 600, 'ArcLight+Pro')],
    sort_order: 1,
  },
  {
    category_slug: 'hogar',
    name: 'Set de Sábanas MicroFiber 300 Hilos',
    slug: 'set-sabanas-microfiber-300-hilos',
    description: 'Juego de sábanas 4 piezas (sábana plana, ajustable y 2 fundas) de microfibra 300 hilos, suaves al tacto y resistentes al lavado. Disponible en 8 colores. Talla matrimonial.',
    price: 520.00,
    stock: 95,
    photos: [
      placeholder(600, 600, 'Sabanas+300H'),
      placeholder(600, 600, 'Sabanas+Set'),
    ],
    sort_order: 2,
  },
  {
    category_slug: 'hogar',
    name: 'Cafetera Espresso CremaMaster',
    slug: 'cafetera-espresso-creamaster',
    description: 'Cafetera espresso de 15 bares de presión, vaporizador de leche incorporado, depósito de 1.5L y calentamiento en 25 segundos. Incluye filtro doble y tamper profesional.',
    price: 2200.00,
    stock: 18,
    photos: [placeholder(600, 600, 'CremaMaster')],
    sort_order: 3,
  },
  {
    category_slug: 'hogar',
    name: 'Cojín Decorativo VelvetTouch 45x45',
    slug: 'cojin-decorativo-velvettouch-45x45',
    description: 'Cojín decorativo de terciopelo con relleno de fibra hueca hipoalergénica. Cierre invisible en la base. Disponible en 12 colores. Pack de 2 unidades.',
    price: 340.00,
    stock: 150,
    photos: [placeholder(600, 600, 'VelvetTouch')],
    sort_order: 4,
  },
  {
    category_slug: 'hogar',
    name: 'Organizador de Escritorio ModularDesk',
    slug: 'organizador-escritorio-modulardesk',
    description: 'Sistema modular de 6 compartimentos en madera MDF con acabado en roble natural. Incluye bandeja para teléfono, porta-plumas y cajón deslizable. Fácil armado sin tornillos.',
    price: 460.50,
    stock: 67,
    photos: [placeholder(600, 600, 'ModularDesk')],
    sort_order: 5,
  },

  // ── Accesorios (3 productos) ─────────────────────────────────────────────
  {
    category_slug: 'accesorios',
    name: 'Mochila Urbana TravelPack 25L',
    slug: 'mochila-urbana-travelpack-25l',
    description: 'Mochila de 25 litros en nylon 900D resistente al agua, con compartimento acolchado para laptop 15.6", bolsillo frontal organizador, y espalda ergonómica ventilada.',
    price: 1100.00,
    stock: 55,
    photos: [
      placeholder(600, 600, 'TravelPack+25L'),
      placeholder(600, 600, 'TravelPack+Interior'),
    ],
    sort_order: 1,
  },
  {
    category_slug: 'accesorios',
    name: 'Billetera Slim RFID Shield',
    slug: 'billetera-slim-rfid-shield',
    description: 'Billetera minimalista en cuero genuino con bloqueo RFID/NFC. Capacidad para 6 tarjetas + compartimento para billetes. Disponible en negro, marrón y azul marino.',
    price: 450.00,
    stock: 120,
    photos: [placeholder(600, 600, 'RFID+Shield')],
    sort_order: 2,
  },
  {
    category_slug: 'accesorios',
    name: 'Gafas de Sol PolarFrame UV400',
    slug: 'gafas-de-sol-polarframe-uv400',
    description: 'Gafas con lentes polarizadas UV400, montura de acetato italiano y bisagras de acero inoxidable. Incluye estuche rígido y paño de microfibra. Protección total contra rayos UVA/UVB.',
    price: 980.00,
    stock: 38,
    photos: [placeholder(600, 600, 'PolarFrame')],
    sort_order: 3,
  },

  // ── Deportes (5 productos) ────────────────────────────────────────────────
  {
    category_slug: 'deportes',
    name: 'Tenis Running AeroStride X2',
    slug: 'tenis-running-aerostride-x2',
    description: 'Zapatilla running con suela de goma carbono, espuma reactiva EVA y upper de mesh transpirable. Peso: 245g. Ideal para asfalto y pista. Horma estándar, tallas 24-30 MX.',
    price: 1650.00,
    stock: 70,
    photos: [
      placeholder(600, 600, 'AeroStride+X2'),
      placeholder(600, 600, 'AeroStride+Sole'),
    ],
    sort_order: 1,
  },
  {
    category_slug: 'deportes',
    name: 'Botella Térmica HydroFuel 750ml',
    slug: 'botella-termica-hydrofuel-750ml',
    description: 'Botella de acero inoxidable 18/8 con doble pared al vacío. Mantiene frío 24h y caliente 12h. Tapa antigoteo, boca ancha y base antideslizante. Sin BPA.',
    price: 380.00,
    stock: 200,
    photos: [placeholder(600, 600, 'HydroFuel+750')],
    sort_order: 2,
  },
  {
    category_slug: 'deportes',
    name: 'Mat de Yoga EcoGrip Pro 6mm',
    slug: 'mat-yoga-ecogrip-pro-6mm',
    description: 'Mat de yoga en caucho natural reciclado, 6mm de grosor, superficie antideslizante en ambas caras y alineadores de posición impresos. Libre de PVC. Incluye cargadera.',
    price: 720.00,
    stock: 43,
    photos: [placeholder(600, 600, 'EcoGrip+Pro')],
    sort_order: 3,
  },
  {
    category_slug: 'deportes',
    name: 'Guantes de Boxeo ImpactShield 12oz',
    slug: 'guantes-boxeo-impactshield-12oz',
    description: 'Guantes de boxeo en cuero sintético premium, relleno de espuma trilaminar y cierre de velcro ancho. Peso 12oz. Aptos para saco, sparring y cardio. Incluye bolsa de malla.',
    price: 890.00,
    stock: 25,
    photos: [placeholder(600, 600, 'ImpactShield+12oz')],
    sort_order: 4,
  },
  {
    category_slug: 'deportes',
    name: 'Cuerda de Saltar SpeedRope Pro',
    slug: 'cuerda-saltar-speedrope-pro',
    description: 'Cuerda de saltar con cable de acero recubierto PVC 3mm, manijas ergonómicas de aluminio con rodamiento de bolas y longitud ajustable. Para crossfit, boxeo y cardio.',
    price: 250.00,
    stock: 180,
    photos: [placeholder(600, 600, 'SpeedRope+Pro')],
    sort_order: 5,
  },
];

// ─── Seed banners de prueba ───────────────────────────────────────────────────
interface BannerSeed {
  title: string; image_url: string; link_url: string | null;
  start_date: string; end_date: string; sort_order: number;
}

const BANNERS: BannerSeed[] = [
  {
    title: 'Semana de Electrónica — Hasta 20% OFF',
    image_url: 'https://placehold.co/1200x300/4f46e5/4f46e5',
    link_url: '/?category_slug=electronica',
    start_date: '2026-03-01', end_date: '2026-04-30', sort_order: 1,
  },
  {
    title: 'Nueva Colección Primavera-Verano 2026',
    image_url: 'https://placehold.co/1200x300/f59e0b/f59e0b',
    link_url: '/?category_slug=ropa',
    start_date: '2026-03-15', end_date: '2026-06-30', sort_order: 2,
  },
  {
    title: 'Deporte y Bienestar — Empieza hoy',
    image_url: 'https://placehold.co/1200x300/10b981/10b981',
    link_url: '/?category_slug=deportes',
    start_date: '2026-01-01', end_date: '2026-12-31', sort_order: 3,
  },
];

// ─── Admin user seed ──────────────────────────────────────────────────────────
// Contraseña: Admin1234! (bcrypt hash generado con salt 12)
const ADMIN_HASH = '$2b$12$pBDh.Hir0WiygeBpd0vQieWjJYm9r10HknFeCEsMuGCP7/5b3gBpK';

// ─── Runner ───────────────────────────────────────────────────────────────────
async function seed() {
  const client = await pool.connect();
  console.log(`\n${CYAN}${BOLD}EcommFast — Database Seeder${RESET}\n${'─'.repeat(44)}`);

  try {
    await client.query('BEGIN');

    // 0. Limpiar datos existentes (orden inverso por FK)
    inf('Limpiando datos previos...');
    await client.query(`DELETE FROM inventory_logs`);
    await client.query(`DELETE FROM sale_items`);
    await client.query(`DELETE FROM sales`);
    await client.query(`DELETE FROM returns`);
    await client.query(`DELETE FROM products`);
    await client.query(`DELETE FROM categories`);
    await client.query(`DELETE FROM banners`);
    await client.query(`DELETE FROM users WHERE role = 'admin'`);
    ok('Datos previos eliminados');

    // 1. Insertar categorías
    inf(`Insertando ${CATEGORIES.length} categorías...`);
    const categoryIds = new Map<string, string>();
    for (const cat of CATEGORIES) {
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO categories (name, slug, description, is_active, sort_order)
         VALUES ($1, $2, $3, true, $4) RETURNING id`,
        [cat.name, cat.slug, cat.description, cat.sort_order],
      );
      categoryIds.set(cat.slug, rows[0].id);
    }
    ok(`${CATEGORIES.length} categorías insertadas`);

    // 2. Insertar productos
    inf(`Insertando ${PRODUCTS.length} productos...`);
    let outOfStockCount = 0;
    for (const prod of PRODUCTS) {
      const catId = categoryIds.get(prod.category_slug);
      if (!catId) throw new Error(`Categoría no encontrada: ${prod.category_slug}`);

      await client.query(
        `INSERT INTO products (category_id, name, slug, description, price, stock, photos, is_active, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, true, $8)`,
        [catId, prod.name, prod.slug, prod.description, prod.price, prod.stock,
         JSON.stringify(prod.photos), prod.sort_order],
      );
      if (prod.stock === 0) outOfStockCount++;
    }
    ok(`${PRODUCTS.length} productos insertados (${outOfStockCount} con stock=0)`);

    // 3. Insertar banners
    inf(`Insertando ${BANNERS.length} banners de prueba...`);
    for (const banner of BANNERS) {
      await client.query(
        `INSERT INTO banners (title, image_url, link_url, start_date, end_date, is_active, sort_order)
         VALUES ($1, $2, $3, $4, $5, true, $6)`,
        [banner.title, banner.image_url, banner.link_url,
         banner.start_date, banner.end_date, banner.sort_order],
      );
    }
    ok(`${BANNERS.length} banners insertados`);

    // 4. Insertar usuario admin
    inf('Insertando usuario admin de prueba...');
    await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, 'Admin', 'EcommFast', 'admin')
       ON CONFLICT (email) DO NOTHING`,
      ['admin@ecommfast.com', ADMIN_HASH],
    );
    ok('Admin: admin@ecommfast.com / Admin1234!');

    await client.query('COMMIT');

    // ─── Validación con SELECT ────────────────────────────────────────────────
    console.log(`\n${BOLD}Validación de consistencia:${RESET}`);
    console.log('─'.repeat(44));

    const { rows: catRows } = await client.query<{ name: string; total: string }>(
      `SELECT c.name, COUNT(p.id) AS total
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id, c.name
       ORDER BY c.sort_order`,
    );
    console.log(`\n${'Categoría'.padEnd(18)} ${'Productos'.padStart(9)}`);
    console.log('─'.repeat(28));
    for (const r of catRows) {
      console.log(`  ${r.name.padEnd(16)} ${r.total.padStart(9)}`);
    }

    const { rows: stockRows } = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM products WHERE stock = 0`,
    );
    const { rows: totalRows } = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM products`,
    );
    const { rows: bannerRows } = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM banners WHERE is_active = true`,
    );
    const { rows: priceRows } = await client.query<{ min: string; max: string; avg: string }>(
      `SELECT MIN(price)::numeric(10,2) AS min, MAX(price)::numeric(10,2) AS max,
              AVG(price)::numeric(10,2) AS avg FROM products`,
    );

    console.log(`\n  Total productos     : ${BOLD}${totalRows[0].count}${RESET}`);
    console.log(`  Productos sin stock : ${BOLD}${stockRows[0].count}${RESET}`);
    console.log(`  Banners activos     : ${BOLD}${bannerRows[0].count}${RESET}`);
    console.log(`  Precio mínimo       : ${BOLD}$${priceRows[0].min}${RESET}`);
    console.log(`  Precio máximo       : ${BOLD}$${priceRows[0].max}${RESET}`);
    console.log(`  Precio promedio     : ${BOLD}$${priceRows[0].avg}${RESET}`);

    // Verificar integridad FK
    const { rows: orphans } = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE c.id IS NULL`,
    );
    if (parseInt(orphans[0].count) > 0) {
      warn(`⚠  ${orphans[0].count} productos sin categoría válida (revisar FK)`);
    } else {
      ok('Integridad referencial OK — sin productos huérfanos');
    }

    // Verificar cascada: productos visibles con categoría activa
    const { rows: visibleRows } = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.is_active = true AND c.is_active = true`,
    );
    ok(`Productos visibles en frontend (cascada): ${BOLD}${visibleRows[0].count}${RESET}`);

    console.log(`\n${GREEN}${BOLD}✓  Seed completado exitosamente.${RESET}`);
    console.log(`   Ejecuta ${BOLD}npm run dev${RESET} para iniciar el servidor.\n`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`${RED}✗  Error durante el seed:${RESET}`, err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
