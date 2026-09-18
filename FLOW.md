# Execution & Application Flow (FLOW.md)

> **Implementation Status: ACTUAL (Phases 1 & 2 Implemented & Verified)**
> *Note: Execution flows for Phase 1 (Foundation) and Phase 2 (Authentication & RBAC) reflect actual code implementation. Future phases remain PLANNED until implemented.*

---

## 1. Actual Implemented Execution Flows (Phases 1 & 2)

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
        v Displays responsive UI badge: "● React + Vite + Tailwind CSS Active"
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

### Flow 3: Health Check API Flow (ACTUAL)

```
[ HTTP Client (Browser / Postman / Invoke-RestMethod) ]
        |
        v Sends request: GET http://localhost:5000/api/health
[ server/src/app.js ]
        |
        +---> Middleware: cors() (Validates origin)
        +---> Middleware: express.json() (Parses JSON body)
        +---> Router delegate: app.use('/api', healthRoutes)
        |
        v Matched route path: /health
[ server/src/routes/health.routes.js ]
        |
        v Invokes controller: router.get('/health', getHealthStatus)
[ server/src/controllers/health.controller.js ]
        |
        v Function: getHealthStatus(req, res)
        |
        v Responds with HTTP status code 200 OK + JSON payload
```

**Actual Code Execution Path**:
- Entry: `GET /api/health`
- Route: `server/src/routes/health.routes.js` (`router.get('/health', getHealthStatus)`)
- Controller: `server/src/controllers/health.controller.js` (`getHealthStatus(req, res)`)

---

### Flow 4: User Registration Flow (ACTUAL)

```
[ Client / Postman ]
        |
        v Sends: POST /api/auth/register { "name": "...", "email": "...", "password": "..." }
[ server/src/routes/auth.routes.js ]
        |
        v Route handler: router.post('/register', register)
[ server/src/controllers/auth.controller.js ]
        |
        v Function: register(req, res, next)
        |
        +---> Step 1: Validates inputs (Name >= 2 chars, Email regex check, Password >= 6 chars)
        +---> Step 2: Normalizes email -> email.trim().toLowerCase()
        +---> Step 3: Queries DB -> SELECT id FROM users WHERE email = $1
        |             (If exists: Returns 409 Conflict)
        +---> Step 4: Hashes password -> await bcrypt.hash(password, 10)
        +---> Step 5: Inserts into DB with enforced role='user':
        |             INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'user')
        +---> Step 6: Returns 201 Created with safe user details (id, name, email, role, createdAt)
```

**Actual Code Execution Path**:
- Route: `server/src/routes/auth.routes.js` (`router.post('/register', register)`)
- Controller: `server/src/controllers/auth.controller.js` (Function: `register(req, res, next)`)
- Database Service: `server/src/config/db.js` (Function: `query()`)

---

### Flow 5: User Login & JWT Generation Flow (ACTUAL)

```
[ Client / Postman ]
        |
        v Sends: POST /api/auth/login { "email": "...", "password": "..." }
[ server/src/routes/auth.routes.js ]
        |
        v Route handler: router.post('/login', login)
[ server/src/controllers/auth.controller.js ]
        |
        v Function: login(req, res, next)
        |
        +---> Step 1: Validates presence of email & password
        +---> Step 2: Normalizes email -> email.trim().toLowerCase()
        +---> Step 3: Queries DB -> SELECT id, name, email, password_hash, role FROM users WHERE email = $1
        |             (If not found: Returns 401 Unauthorized "Invalid email or password")
        +---> Step 4: Compares password hash -> await bcrypt.compare(password, user.password_hash)
        |             (If mismatch: Returns 401 Unauthorized "Invalid email or password")
        +---> Step 5: Generates signed JWT -> jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '24h' })
        +---> Step 6: Returns 200 OK with token and user profile object
```

**Actual Code Execution Path**:
- Route: `server/src/routes/auth.routes.js` (`router.post('/login', login)`)
- Controller: `server/src/controllers/auth.controller.js` (Function: `login(req, res, next)`)
- Security: `bcrypt.compare()`, `jwt.sign()`

---

### Flow 6: JWT Authentication Middleware Flow (ACTUAL)

```
[ Protected HTTP Request ]
        |
        v Header: Authorization: Bearer <token>
[ server/src/middleware/authMiddleware.js ]
        |
        v Middleware function: authenticateToken(req, res, next)
        |
        +---> Step 1: Checks header presence (If missing: Returns 401 "Authentication token required")
        +---> Step 2: Validates "Bearer <token>" format (If malformed: Returns 401 "Malformed authorization header")
        +---> Step 3: Verifies JWT signature using process.env.JWT_SECRET via jwt.verify()
        |             (If expired/invalid: Returns 401 "Invalid or expired authentication token")
        +---> Step 4: Decodes token payload into req.user = { userId, email, role }
        +---> Step 5: Calls next() to pass control to target route/controller
```

**Actual Code Execution Path**:
- Middleware: `server/src/middleware/authMiddleware.js` (Function: `authenticateToken(req, res, next)`)

---

### Flow 7: Role-Based Authorization Middleware Flow (ACTUAL)

```
[ Request passed from authenticateToken ]
        |
        v Target route requires role (e.g. requireRole('admin'))
[ server/src/middleware/rbacMiddleware.js ]
        |
        v Middleware function wrapper: requireRole(...allowedRoles)(req, res, next)
        |
        +---> Step 1: Asserts req.user exists (If missing: Returns 401)
        +---> Step 2: Checks if allowedRoles.includes(req.user.role)
        |             - IF req.user.role === 'admin': Calls next()
        |             - IF req.user.role !== 'admin': Returns 403 Forbidden
        |               {"status": "error", "statusCode": 403, "message": "Access forbidden..."}
```

**Actual Code Execution Path**:
- Middleware: `server/src/middleware/rbacMiddleware.js` (Function: `requireRole(...allowedRoles)`)

---

### Flow 8: Get Current User Profile Flow (ACTUAL)

```
[ Client Request ]
        |
        v GET /api/auth/me (Header: Authorization: Bearer <valid_jwt>)
[ server/src/routes/auth.routes.js ]
        |
        +---> Executing middleware: authenticateToken
        |     (Populates req.user = { userId, email, role })
        |
        v Delegate to controller: router.get('/me', authenticateToken, getMe)
[ server/src/controllers/auth.controller.js ]
        |
        v Function: getMe(req, res, next)
        |
        +---> Queries DB: SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1
        +---> Returns 200 OK with safe user details (excluding password_hash)
```

**Actual Code Execution Path**:
- Route: `server/src/routes/auth.routes.js` (`router.get('/me', authenticateToken, getMe)`)
- Middleware: `server/src/middleware/authMiddleware.js` (`authenticateToken`)
- Controller: `server/src/controllers/auth.controller.js` (`getMe(req, res, next)`)

---

## 2. Planned Application Flows (Phase 3+)

> **Status: PLANNED (Not yet implemented)**

- Product Management CRUD (`POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`)
- Cart Sync Operations (`GET /api/cart`, `POST /api/cart`, `DELETE /api/cart/:id`)
- Transactional Order Checkout (`POST /api/orders`)
- Admin Order Management (`GET /api/orders`, `PATCH /api/orders/:id/status`)
