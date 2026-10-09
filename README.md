# Garment Production System & CRM (Radhe Label)

A specialized ERP and CRM tool for bespoke tailoring, couture boutique management, and garment manufacturing production lines. Built with Next.js App Router, Prisma ORM, PostgreSQL, and Tailwind CSS.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: Next.js 15 (App Router, Server & Client Components)
- **Database & ORM**: PostgreSQL via Prisma ORM
- **UI & Styling**: Tailwind CSS, Lucide React, Radix UI Dialog / Primitive components
- **Language**: TypeScript

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+
- PostgreSQL database (running locally on port 5432 or remote cluster)

### 2. Environment Variables
Create or verify `.env` in the project root:
```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/<database_name>?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Install Dependencies & Generate Prisma Client
```bash
npm install
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```
> **Automatic Migration on Start**: Running `npm run dev` or `npm start` automatically executes `prisma migrate deploy` before launching Next.js, ensuring any pending schema migrations are applied immediately to the database.

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🗄️ Database & Migration Guide

### PostgreSQL Architecture & Baseline
The database schema has been migrated to PostgreSQL. Stale SQLite migrations have been consolidated into a clean PostgreSQL baseline:
- Baseline migration: `prisma/migrations/20261009000000_init/migration.sql`
- Provider lock: `prisma/migrations/migration_lock.toml` configured for `provider = "postgresql"`

### Schema Models
- **`Client`**: Customer profiles, contact details, measurement associations.
- **`Measurement`**: Bespoke tailoring measurements per client (blouse, kurta, lehenga, trousers, etc.).
- **`BulkOrder`**: Production orders for bulk batches and custom boutique pieces.
  - **Soft-Delete Support**: Fields `isDeleted` (`Boolean`, default `false`), `deletedAt` (`DateTime?`), and `deleteReason` (`String?`) prevent accidental data loss and maintain a full audit trail.
- **`BulkOrderItem`**: Itemized lines per order including outfit styles, sizes, and quantities.
- **`Material`** & **`MaterialUsage`**: Fabric inventory and consumption tracking.
- **`Invoice`**: Financial invoicing, advance payments, GST calculations, and settlement status.
- **`OutfitStyle`**: Catalogue of pattern styles, base prices, and production time estimates.

### Making Database Changes (Prisma Workflow)

Whenever you add or modify fields in `prisma/schema.prisma`:

1. **Create and apply a migration**:
   ```bash
   npx prisma migrate dev --name <describe_your_change>
   ```
   *Prisma will generate a timestamped SQL migration file under `prisma/migrations/` and apply it to PostgreSQL.*

2. **Regenerate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Check Migration Status**:
   ```bash
   npx prisma migrate status
   ```

4. **Visual Database Explorer**:
   ```bash
   npx prisma studio
   ```

---

## 📦 Key Application Modules

- **`/orders`**: Production order board, status tracking (Pending, In Production, Ready for Fitting, Completed, Delivered), and soft-deletion with audit recovery.
- **`/clients`**: Customer CRM with full measurement history and preferences.
- **`/inventory`**: Raw material and fabric stock management.
- **`/invoices`**: Billing, GST invoice generation, and payment ledger.
- **`/tailoring`**: Job assignment and status tracking for master cutters and tailors.
