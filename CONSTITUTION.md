[APPROVED]
# CONSTITUTION.md — EcommFast
> **Estado:** PENDIENTE DE APROBACIÓN — Añadir `[APPROVED]` al inicio de este archivo para habilitar el desarrollo.

---

## 1. Principios Arquitectónicos No Negociables

| # | Principio | Descripción |
|---|-----------|-------------|
| A1 | **Separation of Concerns** | Backend puro API REST; Frontend solo consume endpoints. Ninguna lógica de negocio en el cliente. |
| A2 | **DB como fuente de verdad** | Todas las restricciones de inventario y retornos se aplican PRIMERO a nivel de constraint SQL, LUEGO en la capa de servicio. |
| A3 | **Fail-Secure** | En caso de error de gateway de pago, se revierte la transacción. Nunca se descuenta stock si el pago no confirma. |
| A4 | **Cascada declarativa** | La visibilidad en cascada (categoría → producto) se resuelve en query, no en lógica de aplicación, para garantizar consistencia. |
| A5 | **Configurabilidad > Hardcoding** | Gateways de pago, Apple Pay y Google Pay se activan/desactivan por flags en DB (`payment_providers` table), no por variables de entorno. |
| A6 | **Zero Trust en APIs** | Todos los endpoints de admin requieren JWT + rol `admin`. Los endpoints públicos son de solo lectura. |

---

## 2. Decisiones de Diseño Técnico

### 2.1 Base de Datos
- **Motor:** PostgreSQL 15+
- **ORM/Query:** `node-postgres` (pg) con queries SQL raw en archivos `.sql` versionados — sin ORM pesado para mantener control sobre constraints y performance.
- **Migraciones:** Archivos numerados `001_create_users.sql`, `002_create_categories.sql`, etc. Ejecutados secuencialmente. Herramienta: `node-pg-migrate` o script propio.
- **JSONB para fotos:** El campo `photos` en `products` será `JSONB` con máximo 5 elementos (constraint CHECK).

### 2.2 Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Express 4.x
- **Autenticación:** JWT (access token 15min + refresh token 7d en httpOnly cookie)
- **Validación de entrada:** `zod` — schema validation en cada route handler
- **Rate limiting:** `express-rate-limit` en endpoints de auth y checkout
- **Logging:** `pino` con niveles info/warn/error — sin console.log en producción

### 2.3 Frontend
- **Build tool:** Vite 5.x
- **Estilos:** Tailwind CSS 3.x — design tokens definidos en `tailwind.config.ts`
- **Estado global:** Zustand (liviano, sin boilerplate de Redux)
- **Fetching:** TanStack Query (React Query) para caché y revalidación
- **Carrusel:** `embla-carousel-react` (ligero, accesible)
- **Zoom de producto:** `react-medium-image-zoom` o implementación custom con CSS transform

### 2.4 Pagos
- Abstracción: clase `PaymentProvider` con métodos `charge()`, `refund()`, `validate()`
- Implementaciones: `StripeProvider`, `OpenPayProvider`, `PayPalProvider`
- Apple Pay / Google Pay: gestionados como métodos de Stripe (Payment Request API)
- Flag de habilitación en tabla `payment_providers` (admin puede toggle desde panel)

---

## 3. Secure Software Design (SSD) — Modelo de Amenazas

### 3.1 Superficies de Ataque Identificadas

| ID | Superficie | Amenaza | Control |
|----|-----------|---------|---------|
| T01 | API de Checkout | Compra de producto sin stock (race condition) | Constraint DB `CHECK (stock >= 0)` + transacción serializable |
| T02 | API de Devoluciones | Manipulación de fecha de venta | Fecha tomada de DB (no del cliente) en validación backend |
| T03 | Panel de Admin | Escalación de privilegios | JWT con claim `role`, validado en middleware antes de cada handler |
| T04 | Upload de fotos | Upload de archivos maliciosos | Validación MIME type, límite 5MB por foto, almacenamiento en S3/local separado |
| T05 | API pública de productos | Scraping masivo / DDoS | Rate limiting por IP en endpoints públicos |
| T06 | Pagos | Replay attack / CSRF en webhooks | Verificación de firma Stripe/OpenPay en cada webhook |
| T07 | Datos de usuario | SQL Injection | Queries parametrizadas — NUNCA interpolación de strings |
| T08 | Sesiones | Robo de token | JWT en httpOnly cookie; refresh rotation; invalidación en logout |
| T09 | Banners | XSS via contenido de admin | Sanitización con `DOMPurify` en frontend; Content-Security-Policy header |
| T10 | Variables de entorno | Exposición de secrets | `.env` en `.gitignore`; secrets en Vault/Secrets Manager en producción |

### 3.2 Controles de Seguridad Obligatorios

- [ ] Helmet.js (HTTP security headers) en Express
- [ ] CORS configurado con whitelist de origins
- [ ] Input sanitization en todos los endpoints (zod + trim)
- [ ] Passwords: bcrypt con salt rounds >= 12
- [ ] Logs de auditoría en tabla `audit_logs` para operaciones admin críticas
- [ ] HTTPS obligatorio en producción (redirect automático)
- [ ] Dependency scanning: `npm audit` en CI/CD pipeline

### 3.3 Privacidad y Datos
- PII mínimo: solo email, nombre y dirección de envío
- No almacenar datos de tarjeta (delegado 100% a gateways PCI-DSS)
- Soft delete en usuarios (`deleted_at timestamp`) — nunca borrado físico

---

## 4. Restricciones Técnicas

1. Usa TypeScript en backend
2. Frontend SÍ usa TypeScript estricto (`strict: true` en tsconfig).
3. No se implementará microservicios — monolito modular para MVP.
4. No se usará ningún ORM (Sequelize, Prisma, TypeORM) — SQL raw con `pg`.
5. Las fotos se almacenan localmente en `/uploads` durante desarrollo; en producción se migra a S3 compatible (sin cambio de interfaz).
