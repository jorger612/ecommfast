# PROJECT_PLAN.md — EcommFast
**Fecha de inicio:** 2026-03-26
**Stack:** React (Vite) + Tailwind CSS | Node.js (Express) | PostgreSQL
**Arquitecto Lead:** Claude Code — Architect-Agent

---

## Visión del Producto
EcommFast es una plataforma de comercio electrónico con gestión de inventario estricta, devoluciones con ventana de 30 días, visibilidad en cascada por categorías, y administrador multi-gateway de pagos (Stripe, OpenPay, PayPal + Apple Pay / Google Pay).

---

## Estructura de Carpetas (Monorepo)

```
ecommfast/
├── PROJECT_PLAN.md
├── CONSTITUTION.md
├── SPEC.md
├── backend/
│   ├── src/
│   │   ├── config/          # DB, env, logger
│   │   ├── controllers/     # HTTP handlers
│   │   ├── middlewares/     # auth, validation, error
│   │   ├── models/          # Queries SQL / ORM
│   │   ├── routes/          # Express routers
│   │   ├── services/        # Business logic (inventory, returns, payments)
│   │   └── utils/
│   ├── migrations/          # SQL migration files
│   ├── seeds/               # Data seeds para desarrollo
│   ├── tests/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/          # Átomos: Button, Badge, Input…
│   │   │   ├── catalog/     # Carrusel, ProductCard, ZoomViewer
│   │   │   ├── cart/
│   │   │   ├── admin/       # Panel control: banners, pagos, productos
│   │   │   └── layout/      # Header, Footer, Sidebar
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/        # Axios clients
│   │   ├── store/           # Estado global (Zustand o Context)
│   │   └── utils/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
└── docker-compose.yml       # PostgreSQL local
```

---

## Fases del Proyecto

| # | Fase | Estado |
|---|------|--------|
| 0 | Planificación y SSD — `CONSTITUTION.md` + `SPEC.md` | ⏳ EN CURSO |
| 1 | Base de Datos — Migraciones PostgreSQL | ⏸ PENDIENTE APROBACIÓN |
| 2 | Backend — Express + servicios de negocio | ⏸ PENDIENTE APROBACIÓN |
| 3 | Frontend — Vite + Tailwind + componentes core | ⏸ PENDIENTE APROBACIÓN |
| 4 | Integración de Pagos — Multi-gateway | ⏸ PENDIENTE APROBACIÓN |
| 5 | QA — Tests unitarios, integración y seguridad | ⏸ PENDIENTE APROBACIÓN |

---

## Reglas de Negocio Críticas (Resumen Ejecutivo)

1. **Stock = 0 → Venta bloqueada** (constraint DB + validación backend)
2. **Devolución válida si:** `fecha_actual <= fecha_venta + 30 días`
3. **Cascada de categorías:** `is_active = false` en categoría oculta todos sus productos en frontend
4. **sort_order admin:** productos y categorías ordenados por campo configurable
5. **Banners temporales:** `start_date` / `end_date` controlan visibilidad automática
