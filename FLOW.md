# Execution & Application Flow (FLOW.md)

> **Phase 1 Implementation Status: ACTUAL (Implemented & Verified)**
> *Note: Phase 1 execution flows below reflect the actual code implementation. Subsequent feature phases remain PLANNED until implemented.*

---

## 1. Actual Implemented Execution Flows (Phase 1)

### Flow 1: Frontend Startup Flow (ACTUAL)

```
[ client/index.html ]
        |
        v Loads script entry point (<script type="module" src="/src/main.jsx">)
[ client/src/main.jsx ]
        |
        +---> Imports React, ReactDOM, App.jsx, and index.css (@import "tailwindcss")
        +---> Calls: ReactDOM.createRoot(document.getElementById('root'))
        +---> Invokes: .render(<React.StrictMode><App /></React.StrictMode>)
        |
        v Renders component hierarchy
[ client/src/App.jsx ]
        |
        +---> Wraps layout with <BrowserRouter> from 'react-router-dom'
        +---> Defines <Routes> matching path="/" to <Home />
        |
        v Displays initial responsive UI badge: "● React + Vite + Tailwind CSS Active"
```

**Actual Code Execution Path**:
- File: `client/index.html` (DOM root container `#root`)
- File: `client/src/main.jsx` (Function: `ReactDOM.createRoot().render()`)
- File: `client/src/App.jsx` (Components: `App()`, `Home()`)
- File: `client/src/index.css` (Tailwind directive `@import "tailwindcss";`)

---

### Flow 2: Backend Startup Flow (ACTUAL)

```
[ server/server.js ]
        |
        +---> Executes: dotenv.config() (Loads environment variables from .env)
        +---> Imports: app from './src/app.js'
        +---> Imports: { testDbConnection } from './src/config/db.js'
        |
        +---> Calls async function: startServer()
        |        |
        |        +---> Executing: await testDbConnection() (Tests PostgreSQL pool connection)
        |        |
        |        +---> Executing: app.listen(PORT, callback)
        |
        v Express HTTP Server listening on process.env.PORT (Default: 5000)
```

**Actual Code Execution Path**:
- File: `server/server.js` (Function: `startServer()`)
- File: `server/src/app.js` (Express application setup)
- File: `server/src/config/db.js` (Exports: `pool`, `query()`, `testDbConnection()`)

---

### Flow 3: Health API Execution Flow (ACTUAL)

```
[ HTTP Client (Browser / Postman / Invoke-RestMethod) ]
        |
        v Sends request: GET http://localhost:5000/api/health
[ server/server.js ]
        |
        v Passes request to Express App instance
[ server/src/app.js ]
        |
        +---> Middleware: cors() (Validates CORS origin)
        +---> Middleware: express.json() (Parses JSON body if present)
        +---> Router delegate: app.use('/api', healthRoutes)
        |
        v Matched route path: /health
[ server/src/routes/health.routes.js ]
        |
        v Invokes controller action: router.get('/health', getHealthStatus)
[ server/src/controllers/health.controller.js ]
        |
        v Function: getHealthStatus(req, res)
        |
        +---> Formats JSON payload:
              {
                "status": "ok",
                "message": "API is running successfully",
                "timestamp": "2026-09-18T...",
                "environment": "development"
              }
        |
        v Responds with HTTP status code 200 OK
```

**Actual Code Execution Path**:
- Entry: `GET /api/health`
- Route: `server/src/routes/health.routes.js` (Route: `router.get('/health', getHealthStatus)`)
- Controller: `server/src/controllers/health.controller.js` (Function: `getHealthStatus(req, res)`)
- Middleware: `server/src/middleware/errorHandler.js` (Functions: `notFoundHandler`, `errorHandler`)

---

### Flow 4: Database Startup & Connection Check Flow (ACTUAL)

```
[ server/server.js ]
        |
        v Invokes: await testDbConnection() during startServer()
[ server/src/config/db.js ]
        |
        +---> Evaluates process.env.DATABASE_URL
        |
        +--- IF DATABASE_URL is missing:
        |      +--> Logs: "⚠️  DATABASE_URL environment variable is not set."
        |      +--> Returns: false
        |
        +--- IF DATABASE_URL is present:
               +--> Invokes: pool.query('SELECT NOW() as current_time, current_database() as db_name')
               +--> SUCCESS:
               |      +--> Logs: "✅ Database connection successful!"
               |      +--> Logs database name and database timestamp
               |      +--> Returns: true
               +--> FAILURE:
                      +--> Catches error
                      +--> Logs: "❌ Database connection failed!" with error.message
                      +--> Returns: false
```

**Actual Code Execution Path**:
- File: `server/src/config/db.js` (Pool instance: `new Pool({ connectionString })`, Function: `testDbConnection()`)

---

## 2. Planned Application Flows (Phase 2+)

> **Status: PLANNED (Not yet implemented)**

### User & Admin Application Flow (Planned)
```
[ Visitor Landing ] ---> [ Browse Catalog ] ---> [ View Product Detail ] ---> [ Add to Cart ]
                                                                                   |
                                                                                   v
[ Order History / Status Tracking ] <--- [ Order Created ] <--- [ Checkout ] <----+
```

### Planned Database Schema Architecture (`server/src/db/schema.sql`)
- Table `users`: `id`, `name`, `email`, `password_hash`, `role` (`user` | `admin`), `created_at`, `updated_at`
- Table `products`: `id`, `name`, `description`, `price`, `image_url`, `category`, `stock`, `created_at`, `updated_at`
- Table `cart_items`: `id`, `user_id`, `product_id`, `quantity`, `created_at`, `updated_at`, `CONSTRAINT uk_user_product UNIQUE (user_id, product_id)`
- Table `orders`: `id`, `user_id`, `total_amount`, `shipping_address`, `status` (`PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`), `created_at`, `updated_at`
- Table `order_items`: `id`, `order_id`, `product_id`, `quantity`, `price_at_purchase`
