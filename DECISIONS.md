# Architectural & Design Decisions (DECISIONS.md)

## 1. Executive Summary & Scope

This document details the architectural, technical, and operational design choices for a production-ready, internship-level full-stack **E-Commerce Web Application**. The system is built with a decoupled architecture utilizing **React + Vite + Tailwind CSS** on the frontend, **Node.js + Express.js** on the backend, and **PostgreSQL** as the relational database engine.

---

## 2. Phase 1 Implementation Decision Log

### Decision 1: React + Vite for Frontend Tooling
- **Context**: Need a fast, responsive Single Page Application (SPA) development toolchain with instant Hot Module Replacement (HMR).
- **Alternatives considered**: Next.js (App Router), Create React App (CRA).
- **Why this approach**: Vite provides lighting-fast dev server startup and build times. Next.js adds Server-Side Rendering (SSR) complexity that conflicts with building a dedicated Express REST API backend.
- **Trade-offs**: Client-Side Rendering (CSR) requires standard initial bundle download before rendering.

### Decision 2: Tailwind CSS v4 for Frontend Styling
- **Context**: Require a responsive, modern UI styling framework without monolithic custom CSS files.
- **Alternatives considered**: Vanilla CSS, Bootstrap 5, Styled Components.
- **Why this approach**: Utility-first CSS allows rapid UI development directly inside React JSX with consistent design tokens.
- **Trade-offs**: JSX class strings can become verbose; mitigated by React subcomponents.

### Decision 3: Express.js for Backend Framework
- **Context**: Need an unopinionated, reliable, and lightweight HTTP web framework.
- **Alternatives considered**: Fastify, NestJS, Koa.js.
- **Why this approach**: Express is the industry standard Node.js framework with universal ecosystem support and middleware clarity.
- **Trade-offs**: Express lacks built-in project structure; mitigated by clean folder organization (`config/`, `middleware/`, `routes/`, `controllers/`, `db/`).

### Decision 4: PostgreSQL as Relational Database Engine
- **Context**: E-Commerce domain requires strict data consistency across users, products, stock, carts, orders, and order items.
- **Alternatives considered**: MongoDB, MySQL, SQLite.
- **Why this approach**: PostgreSQL is an ACID-compliant relational engine supporting foreign keys, check constraints, unique indexes, and transactions.
- **Trade-offs**: Requires upfront SQL schema creation and migration management.

### Decision 5: Native `pg` Pool Driver Instead of an ORM
- **Context**: Executing database queries from Node.js backend.
- **Alternatives considered**: Prisma ORM, TypeORM, Sequelize.
- **Why this approach**: Using `pg` with parameterized queries (`$1`, `$2`) demonstrates raw SQL expertise, direct query visibility, and zero ORM abstraction overhead.
- **Trade-offs**: SQL queries must be manually written; mitigated by centralizing DB queries inside services/controllers.

### Decision 6: PostgreSQL Connection Pooling (`pg.Pool`)
- **Context**: Managing database connections efficiently under concurrent HTTP API requests.
- **Alternatives considered**: Single long-lived connection or new connection per request.
- **Why this approach**: `pg.Pool` maintains a reusable pool of connections shared across incoming API requests, avoiding connection starvation.
- **Trade-offs**: Requires proper pool initialization and error handling configuration.

### Decision 7: Decoupled Client/Server Application Architecture
- **Context**: Structuring frontend and backend repositories.
- **Alternatives considered**: Monolithic server-side rendered application or single combined folder.
- **Why this approach**: Keeps `client/` and `server/` concerns strictly isolated into independent modules with separate `package.json` files, allowing independent deployment (Vercel & Render).
- **Trade-offs**: Requires CORS configuration on backend.

### Decision 8: Relational Foreign Key Constraints (`REFERENCES`)
- **Context**: Enforcing referential integrity across relational tables.
- **Alternatives considered**: Soft application-level references without database constraints.
- **Why this approach**: Database-level foreign keys with `ON DELETE CASCADE` / `RESTRICT` prevent orphaned records and data corruption.
- **Trade-offs**: Deleting records requires awareness of table dependency ordering.

### Decision 9: Dedicated `cart_items` Table with Unique Constraint
- **Context**: Managing shopping cart items for users.
- **Alternatives considered**: Storing cart JSON in `users` table or client LocalStorage only.
- **Why this approach**: Enforces relational correctness with `UNIQUE(user_id, product_id)` and enables cross-device cart synchronization.
- **Trade-offs**: Requires database I/O for cart updates; optimized via index `idx_cart_user`.

### Decision 10: Normalized `order_items` Line Items Table
- **Context**: Representing line item products within an order.
- **Alternatives considered**: Storing order items as a JSON text blob.
- **Why this approach**: Normalizing `order_items` allows joining with `products` for reporting and clean schema validation (`quantity > 0`).
- **Trade-offs**: Requires SQL join to fetch complete order details.

### Decision 11: `price_at_purchase` Snapshot Column in `order_items`
- **Context**: Handling historical order price accuracy when catalog prices change.
- **Alternatives considered**: Dynamic join fetching current product price.
- **Why this approach**: Storing `price_at_purchase` captures the immutable historical price paid at the time of order placement.
- **Trade-offs**: Duplicates price data at order time, required for financial accuracy.

### Decision 12: Environment Variable Configuration (`dotenv` & `.env.example`)
- **Context**: Managing sensitive secrets (`DATABASE_URL`, `JWT_SECRET`).
- **Alternatives considered**: Hardcoding secrets in source code.
- **Why this approach**: Adheres to Twelve-Factor App principles and prevents committing credentials to version control.
- **Trade-offs**: Requires developers to maintain local `.env` files.

---

## 3. Phase 2 Implementation Decision Log (Authentication & Role Foundation)

### Decision 13: Password Hashing with `bcrypt` (Salt Rounds = 10)
- **Context**: Securely storing user credentials in `users.password_hash`.
- **Alternatives considered**: Plaintext, MD5, SHA256, Argon2.
- **Why this approach**: `bcrypt` automatically incorporates an adaptive salt mechanism resistant to rainbow table and brute-force attacks. 10 salt rounds provide an optimal balance between computation security (~80ms per hash) and server responsiveness. Plaintext or MD5/SHA256 without salt are insecure.
- **Trade-offs**: Slightly higher CPU overhead during registration/login compared to plain hashes.

### Decision 14: Stateless JSON Web Tokens (JWT) for REST Authentication
- **Context**: Authenticating client API requests statelessly without server session storage.
- **Alternatives considered**: Server-side Express sessions (`express-session` + Redis), OAuth2 / Auth0 third-party.
- **Why this approach**: JWT tokens containing `{ userId, email, role }` allow the Express REST backend to remain stateless, enabling horizontal scaling and clean separation from the React frontend.
- **Trade-offs**: Immediate token revocation prior to 24h expiration requires token blacklisting; mitigated by maintaining 24h expiration.

### Decision 15: Standard `Authorization: Bearer <token>` Header Protocol
- **Context**: Passing authentication credentials from React client to Express API.
- **Alternatives considered**: HttpOnly Cookies, Query parameters (`?token=...`).
- **Why this approach**: Bearer token headers follow standard REST conventions, avoiding CSRF vulnerability vectors associated with automatic cookie submission across different origins.
- **Trade-offs**: Frontend must explicitly attach `Authorization` header on authenticated API calls.

### Decision 16: Centralized Authentication & RBAC Middleware Pipeline
- **Context**: Protecting private routes (`/api/auth/me`, `/api/products` CRUD, `/api/orders`) against unauthenticated or unauthorized access.
- **Alternatives considered**: Duplicating JWT verification logic inside individual controller functions.
- **Why this approach**: Modular Express middleware (`authenticateToken` & `requireRole`) enforces dry, reusable security. Controllers focus purely on business logic without security code duplication.
- **Trade-offs**: Requires correct middleware ordering in route definitions.

### Decision 17: Email Normalization & Generic Credential Failure Responses
- **Context**: Preventing account duplication bugs and mitigating user email enumeration security risks.
- **Alternatives considered**: Storing raw emails without normalization; returning specific errors ("Email not found" vs "Incorrect password").
- **Why this approach**: Normalizing emails (`email.trim().toLowerCase()`) ensures `john@example.com` and `John@Example.com` resolve to the same record. Returning generic `"Invalid email or password"` on login failure prevents attackers from discovering registered user emails.
- **Trade-offs**: Does not specify to the end-user whether their email or password was wrong.

### Decision 18: Public Registration Role Lockdown (`role = 'user'`)
- **Context**: Preventing privilege escalation attacks during registration requests.
- **Alternatives considered**: Accepting optional `role` parameter in `POST /api/auth/register` payload.
- **Why this approach**: Hardcoding `role = 'user'` on public registration guarantees no external client can grant themselves `admin` privileges. Admin accounts can only be created via seed scripts or direct database management.
- **Trade-offs**: Admin role promotion cannot be requested through standard public registration endpoints.

---

## 4. Phase 3 Implementation Decision Log (Product Catalog & Admin Management)

### Decision 19: Product API Route & Controller Structure (`product.routes.js` & `product.controller.js`)
- **Context**: Structuring product catalog and admin management REST APIs inside the Express backend.
- **Alternatives considered**: Merging product handlers into `app.js` or creating an overly complex repository/service layer.
- **Why this approach**: Keeps backend modular and easy to navigate following existing `routes/` and `controllers/` patterns (`server/src/routes/product.routes.js` and `server/src/controllers/product.controller.js`).
- **Trade-offs**: Controllers directly call the database query helper `query()`, which keeps code simple and DRY without premature service abstractions.

### Decision 20: Public Read vs. Admin-Only Write Authorization Model
- **Context**: Enforcing REST API access control for product reading and mutation operations.
- **Alternatives considered**: Requiring authentication for catalog reading, or allowing authenticated non-admin users to update products.
- **Why this approach**: `GET /api/products` and `GET /api/products/:id` are public to allow unauthenticated browsing. Write endpoints (`POST`, `PUT`, `DELETE`) require `authenticateToken` followed by `requireRole('admin')` middleware.
- **Trade-offs**: Backend strictly enforces the authorization boundary regardless of frontend client state.

### Decision 21: Strict Input Validation & Sanitization in Controller Layer
- **Context**: Validating product input fields (`name`, `description`, `price`, `image_url`, `category`, `stock`) for POST and PUT requests.
- **Alternatives considered**: Relying solely on database constraints or frontend validation.
- **Why this approach**: Centralized validation in `validateProductInput()` ensures required fields (`name`, `category`, `price`, `stock`) meet constraints (non-negative price/stock, length bounds) before touching the database.
- **Trade-offs**: Manual validation logic written in JS controller; provides clear, user-friendly 400 error responses.

### Decision 22: Parameterized SQL Queries (`$1`, `$2`, ...) for All Product Operations
- **Context**: Executing product CRUD operations securely against PostgreSQL database.
- **Alternatives considered**: String interpolation or concatenation in SQL statements.
- **Why this approach**: Using parameterized queries (`INSERT INTO products ... VALUES ($1, $2, ...)`) guarantees protection against SQL injection attacks.
- **Trade-offs**: Requires explicit parameter array indexing matching SQL positional placeholders.

### Decision 23: Product Ordering Strategy (`ORDER BY id DESC`)
- **Context**: Specifying default sort order for product list API responses (`GET /api/products`).
- **Alternatives considered**: Sorting by `created_at DESC` or `name ASC` or non-deterministic ordering.
- **Why this approach**: `ORDER BY id DESC` ensures newest products appear first while providing deterministic, index-friendly pagination baseline.
- **Trade-offs**: Does not account for dynamic popularity/sales sorting, which can be introduced in future search/filtering phases.

### Decision 24: Graceful Image URL Handling with UI Fallbacks
- **Context**: Storing and rendering product images across catalog and details views.
- **Alternatives considered**: Uploading binary files directly to database or local disk storage.
- **Why this approach**: Product schema stores URL text (`image_url`). Frontend components (`ProductCard`, `ProductDetailsPage`) validate image loading and display high-quality fallback artwork when URLs are empty or fail to load.
- **Trade-offs**: Relies on external image URLs or CDNs rather than native multipart file uploads.

### Decision 25: Centralized Frontend API Service Layer (`productService.js`)
- **Context**: Abstracting HTTP fetch calls for product endpoints in the React client.
- **Alternatives considered**: Writing raw `fetch` calls inline inside React page components.
- **Why this approach**: `client/src/services/productService.js` encapsulates API URLs, JSON parsing, error throwing, and automatic `Authorization` token header attachment.
- **Trade-offs**: Requires maintaining service functions alongside page components.

### Decision 26: Dual-Layer Admin Frontend Route Protection (`ProtectedRoute.jsx`)
- **Context**: Protecting administrative UI routes (`/admin/products`, `/admin/products/new`, `/admin/products/:id/edit`).
- **Alternatives considered**: Relying solely on hidden navigation links or strictly backend protection.
- **Why this approach**: `ProtectedRoute` checks `useAuth()` session state and `isAdmin` flag on the client to redirect unauthenticated or non-admin users, providing optimal UX while backend remains the real security boundary.
- **Trade-offs**: Requires client route wrapper components and session restoration logic.

### Decision 27: Protected Product Deletion Behavior & Historical Order Integrity
- **Context**: Handling `DELETE /api/products/:id` when products are referenced in foreign-key tables (`cart_items` and `order_items`).
- **Alternatives considered**: Blind `DELETE` query or cascading deletion of historical order records (`ON DELETE CASCADE` on `order_items`).
- **Why this approach**: In `schema.sql`, `order_items` references `products(id)` with `ON DELETE RESTRICT`. Before executing deletion, controller checks if product exists in `order_items`. If referenced, returns HTTP 409 Conflict explaining that deletion is blocked to preserve customer order history, advising stock unlisting instead.
- **Trade-offs**: Products with purchase history cannot be hard-deleted from database, maintaining financial and historical accuracy.

### Decision 28: Standardized JSON Error Payload Format Across Backend
- **Context**: Returning consistent error details for invalid IDs (400), non-existent products (404), unauthorized requests (401/403), and constraint conflicts (409).
- **Alternatives considered**: Returning plain text strings or variable JSON keys.
- **Why this approach**: All endpoints return uniform `{ status: 'error', statusCode: N, message: '...' }` payloads, enabling frontend services and components to render clean `ErrorMessage` components.
- **Trade-offs**: Requires disciplined response formatting across all controller handlers.
