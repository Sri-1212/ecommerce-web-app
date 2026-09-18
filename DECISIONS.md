# Architectural & Design Decisions (DECISIONS.md)

## 1. Executive Summary & Scope

This document details the architectural, technical, and operational design choices for a production-ready, internship-level full-stack **E-Commerce Web Application**. The system is built with a decoupled architecture utilizing **React + Vite + Tailwind CSS** on the frontend, **Node.js + Express.js** on the backend, and **PostgreSQL** as the relational database engine.

---

## 2. Phase 1 Implementation Decision Log

### Decision 1: React + Vite for Frontend Tooling
- **Context**: Need a fast, responsive Single Page Application (SPA) development toolchain with instant Hot Module Replacement (HMR) and optimized build bundles.
- **Alternatives considered**: Next.js (App Router), Create React App (CRA), Webpack bundle from scratch.
- **Why this approach**: Vite provides lighting-fast dev server startup and build times. Next.js adds Server-Side Rendering (SSR) and Server Components complexity that conflicts with building a dedicated Express REST API backend for learning/internship evaluation.
- **Trade-offs**: Client-Side Rendering (CSR) requires standard initial bundle download before rendering, but simplifies decoupling from the backend.

### Decision 2: Tailwind CSS v4 for Frontend Styling
- **Context**: Require a responsive, modern UI styling framework that avoids monolithic custom CSS files while maintaining consistent design tokens (colors, spacing, typography).
- **Alternatives considered**: Vanilla CSS, Bootstrap 5, Styled Components / Emotion.
- **Why this approach**: Utility-first CSS allows rapid UI development directly inside React JSX without CSS name collisions or bloated CSS files.
- **Trade-offs**: HTML/JSX class strings can become verbose; mitigated by composing clean React subcomponents.

### Decision 3: Express.js for Backend Framework
- **Context**: Need an unopinionated, reliable, and lightweight HTTP web framework for routing REST API requests, parsing JSON, handling CORS, and running middleware chains.
- **Alternatives considered**: Fastify, NestJS, Koa.js.
- **Why this approach**: Express is the industry standard Node.js framework with universal ecosystem support, simple middleware composition, and maximum clarity for internship project demonstration.
- **Trade-offs**: Express lacks built-in architectural structure out-of-the-box compared to NestJS; required building our own clean folder structure (`config/`, `middleware/`, `routes/`, `controllers/`, `db/`).

### Decision 4: PostgreSQL as Relational Database Engine
- **Context**: E-Commerce domain requires strict data consistency across users, products, inventory stock, carts, orders, and order item line items.
- **Alternatives considered**: MongoDB, MySQL, SQLite.
- **Why this approach**: PostgreSQL is a robust, ACID-compliant relational database engine supporting foreign key integrity, check constraints (`price >= 0`, `quantity > 0`), unique indexes, and concurrent transactions. MongoDB lacks native multi-table schema constraints.
- **Trade-offs**: Requires upfront SQL schema creation and migration management compared to schemaless document databases.

### Decision 5: Native `pg` Pool Driver Instead of an ORM
- **Context**: Executing database queries from Node.js backend to PostgreSQL.
- **Alternatives considered**: Prisma ORM, TypeORM, Sequelize.
- **Why this approach**: Using `pg` with parameterized queries (`$1`, `$2`) demonstrates raw SQL expertise, direct query visibility, zero ORM abstraction overhead, and precise control over SQL transactions (`BEGIN` / `COMMIT` / `ROLLBACK`).
- **Trade-offs**: SQL queries must be manually written and formatted; mitigated by centralizing database queries inside database services/helpers.

### Decision 6: PostgreSQL Connection Pooling (`pg.Pool`)
- **Context**: Managing database client connections efficiently under concurrent HTTP API requests.
- **Alternatives considered**: Opening a single long-lived database client (`pg.Client`) or creating a new client connection per HTTP request.
- **Why this approach**: Opening a new database connection on every request causes heavy latency and connection starvation. `pg.Pool` maintains a reusable pool of database connections that can be shared across incoming asynchronous API requests.
- **Trade-offs**: Requires proper pool initialization and error handling configuration.

### Decision 7: Decoupled Client/Server Application Architecture
- **Context**: Determining repository and execution structure for frontend and backend codebases.
- **Alternatives considered**: Monolithic server-side rendered application (EJS/Pug templates) or single combined folder.
- **Why this approach**: Keeps frontend (`client/`) and backend (`server/`) concerns strictly isolated into independent modules with separate `package.json` configurations. Allows independent deployment (Vercel for client, Render for server) and independent automated testing.
- **Trade-offs**: Requires CORS configuration on the backend API server.

### Decision 8: Relational Foreign Key Constraints (`REFERENCES`)
- **Context**: Enforcing referential integrity between `users`, `products`, `cart_items`, `orders`, and `order_items`.
- **Alternatives considered**: Soft application-level references without database-level constraints.
- **Why this approach**: Database-level foreign keys with `ON DELETE CASCADE` (for cart items & order items) and `ON DELETE RESTRICT` (for orders & products linked to orders) prevent orphaned records and data corruption even if application code fails.
- **Trade-offs**: Deleting records requires awareness of table dependency ordering.

### Decision 9: Dedicated `cart_items` Table with Unique Constraint
- **Context**: Managing shopping cart items for users.
- **Alternatives considered**: Storing cart JSON directly in a `users.cart` column or storing cart items solely in browser LocalStorage.
- **Why this approach**: A dedicated `cart_items` table with `CONSTRAINT uk_user_product UNIQUE (user_id, product_id)` enforces relational correctness, prevents duplicate entries for the same product, and enables cross-device cart synchronization for logged-in users.
- **Trade-offs**: Requires database I/O for cart updates; optimized via index `idx_cart_user`.

### Decision 10: Normalized `order_items` Line Items Table
- **Context**: Representing products contained within a customer's order.
- **Alternatives considered**: Storing order items as a JSON text blob inside `orders.items` column.
- **Why this approach**: Normalizing `order_items` into a separate relational table allows joining with `products` for reporting, inventory analytics, and clean schema validation (`quantity > 0`).
- **Trade-offs**: Requires a two-table SQL join to fetch complete order details (`orders` + `order_items`).

### Decision 11: `price_at_purchase` Snapshot Column in `order_items`
- **Context**: Handling historical order price accuracy when product catalog prices change in the future.
- **Alternatives considered**: Dynamic join fetching current `products.price` during order history retrieval.
- **Why this approach**: Catalog prices fluctuate over time due to sales or price updates. Storing `price_at_purchase` in `order_items` captures the immutable historical price paid at the time the order was placed, guaranteeing financial and audit accuracy.
- **Trade-offs**: Duplicates price data at order time, which is intentional and necessary for historical accuracy.

### Decision 12: Environment Variable Configuration (`dotenv` & `.env.example`)
- **Context**: Managing sensitive connection strings (`DATABASE_URL`), port configuration (`PORT`), and secrets across development and production environments.
- **Alternatives considered**: Hardcoding connection strings in source code files.
- **Why this approach**: Hardcoding credentials creates critical security vulnerabilities and breaks environment portability. Using process environment variables loaded via `dotenv` adheres to Twelve-Factor App methodology and prevents committing secrets to source control (`.gitignore`).
- **Trade-offs**: Developers must create local `.env` files based on `.env.example` when setting up the project locally.

---

## 3. Technology Stack Overview

| Layer | Technology | Selected Reason |
|---|---|---|
| **Frontend** | React 19 (Vite) + Tailwind CSS v4 + React Router v7 | Fast HMR, utility-first responsive styling, client-side routing |
| **Backend API** | Node.js + Express.js | Standard, non-blocking asynchronous REST server |
| **Database** | PostgreSQL + `pg` (node-postgres) | ACID transactions, foreign keys, parameterized SQL security |
| **Environment** | `dotenv` + `.env.example` | Secure environment variable configuration |
