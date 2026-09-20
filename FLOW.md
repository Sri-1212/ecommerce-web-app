# Execution & Application Flow (FLOW.md)

> **Implementation Status: ACTUAL (Phases 1, 2 & 3 Implemented & Verified)**
> *Note: Execution flows for Phase 1 (Foundation), Phase 2 (Authentication & RBAC), and Phase 3 (Product Catalog & Admin Management) reflect actual code implementation. Future phases remain PLANNED until implemented.*

---

## 1. Actual Implemented Execution Flows (Phases 1, 2 & 3)

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
        +---> Wraps layout with <AuthProvider> and <BrowserRouter>
        +---> Renders <Navbar /> header
        +---> Defines <Routes> for public catalog and protected admin pages
```

---

### Flow 9: Product List Flow (ACTUAL)

```
[ Browser Client ]
        |
        v User navigates to /products
[ client/src/pages/ProductsPage.jsx ]
        |
        +---> Triggers useEffect() -> calls fetchProductsList()
        |
        v Service call: getProducts()
[ client/src/services/productService.js ]
        |
        v Sends HTTP Request: GET /api/products
[ server/src/routes/product.routes.js ]
        |
        v Route handler: router.get('/', getAllProducts)
[ server/src/controllers/product.controller.js ]
        |
        v Function: getAllProducts(req, res, next)
        |
        +---> Queries DB via query(): SELECT id, name, description, price, image_url, category, stock, created_at, updated_at FROM products ORDER BY id DESC
        +---> PostgreSQL Pool executes query and returns row array
        +---> Responds with HTTP 200 OK { status: 'success', data: { products } }
[ client/src/pages/ProductsPage.jsx ]
        |
        v Updates state setProducts(products)
        v Renders responsive grid of <ProductCard /> components
```

**Actual Code Execution Path**:
- Page: `client/src/pages/ProductsPage.jsx` (Function: `fetchProductsList()`)
- Service: `client/src/services/productService.js` (Function: `getProducts()`)
- Route: `server/src/routes/product.routes.js` (`router.get('/', getAllProducts)`)
- Controller: `server/src/controllers/product.controller.js` (Function: `getAllProducts(req, res, next)`)
- Component: `client/src/components/ProductCard.jsx`

---

### Flow 10: Product Details Flow (ACTUAL)

```
[ Browser Client ]
        |
        v User clicks "View Details" or navigates to /products/:id
[ client/src/pages/ProductDetailsPage.jsx ]
        |
        +---> Reads id from useParams()
        +---> Triggers useEffect() -> calls getProductById(id)
[ client/src/services/productService.js ]
        |
        v Sends HTTP Request: GET /api/products/:id
[ server/src/routes/product.routes.js ]
        |
        v Route handler: router.get('/:id', getProductById)
[ server/src/controllers/product.controller.js ]
        |
        v Function: getProductById(req, res, next)
        |
        +---> Step 1: Validates parsePositiveInt(req.params.id) (If invalid: returns 400)
        +---> Step 2: Queries DB: SELECT id, name, description, price, image_url, category, stock, created_at, updated_at FROM products WHERE id = $1
        |             (If not found: returns 404 Not Found)
        +---> Step 3: Returns HTTP 200 OK { status: 'success', data: { product } }
[ client/src/pages/ProductDetailsPage.jsx ]
        |
        v Renders image, full details, price, category tag, stock badge, and metadata
```

**Actual Code Execution Path**:
- Page: `client/src/pages/ProductDetailsPage.jsx` (Function: `fetchDetails()`)
- Service: `client/src/services/productService.js` (Function: `getProductById(id)`)
- Route: `server/src/routes/product.routes.js` (`router.get('/:id', getProductById)`)
- Controller: `server/src/controllers/product.controller.js` (Function: `getProductById(req, res, next)`)

---

### Flow 11: Admin Create Product Flow (ACTUAL)

```
[ Browser Client ]
        |
        v Admin submits form at /admin/products/new
[ client/src/pages/AdminProductFormPage.jsx ]
        |
        +---> Step 1: Runs frontend validation validateFrontend()
        +---> Step 2: Calls service createProduct(payload)
[ client/src/services/productService.js ]
        |
        v Sends HTTP Request: POST /api/products (Header: Authorization: Bearer <admin_token>)
[ server/src/routes/product.routes.js ]
        |
        +---> Executing Middleware 1: authenticateToken (Verifies JWT, sets req.user = { userId, email, role })
        +---> Executing Middleware 2: requireRole('admin') (Verifies req.user.role === 'admin')
        |
        v Delegates to controller: router.post('/', authenticateToken, requireRole('admin'), createProduct)
[ server/src/controllers/product.controller.js ]
        |
        v Function: createProduct(req, res, next)
        |
        +---> Step 1: Runs validateProductInput(req.body) (Checks required fields, types, price >= 0, stock >= 0)
        +---> Step 2: Executes parameterized SQL: INSERT INTO products (name, description, price, image_url, category, stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
        +---> Step 3: Returns HTTP 201 Created { status: 'success', data: { product } }
[ client/src/pages/AdminProductFormPage.jsx ]
        |
        v Displays success banner and navigates to /admin/products
```

**Actual Code Execution Path**:
- Page: `client/src/pages/AdminProductFormPage.jsx` (Function: `handleSubmit(e)`)
- Service: `client/src/services/productService.js` (Function: `createProduct(productData)`)
- Security: `server/src/middleware/authMiddleware.js`, `server/src/middleware/rbacMiddleware.js`
- Route: `server/src/routes/product.routes.js` (`router.post('/', authenticateToken, requireRole('admin'), createProduct)`)
- Controller: `server/src/controllers/product.controller.js` (Function: `createProduct(req, res, next)`)

---

### Flow 12: Admin Update Product Flow (ACTUAL)

```
[ Browser Client ]
        |
        v Admin submits edited form at /admin/products/:id/edit
[ client/src/pages/AdminProductFormPage.jsx ]
        |
        +---> Calls service updateProduct(id, payload)
[ client/src/services/productService.js ]
        |
        v Sends HTTP Request: PUT /api/products/:id (Header: Authorization: Bearer <admin_token>)
[ server/src/routes/product.routes.js ]
        |
        +---> Middleware 1: authenticateToken
        +---> Middleware 2: requireRole('admin')
        |
        v Delegate: router.put('/:id', authenticateToken, requireRole('admin'), updateProduct)
[ server/src/controllers/product.controller.js ]
        |
        v Function: updateProduct(req, res, next)
        |
        +---> Step 1: Validates parsePositiveInt(req.params.id)
        +---> Step 2: Verifies product existence: SELECT id FROM products WHERE id = $1 (If missing: returns 404)
        +---> Step 3: Validates input fields validateProductInput(req.body)
        +---> Step 4: Executes parameterized SQL: UPDATE products SET name = $1, description = $2, price = $3, image_url = $4, category = $5, stock = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *
        +---> Step 5: Returns HTTP 200 OK { status: 'success', data: { product } }
[ client/src/pages/AdminProductFormPage.jsx ]
        |
        v Displays success feedback and redirects to /admin/products
```

**Actual Code Execution Path**:
- Page: `client/src/pages/AdminProductFormPage.jsx` (Function: `handleSubmit(e)`)
- Service: `client/src/services/productService.js` (Function: `updateProduct(id, productData)`)
- Route: `server/src/routes/product.routes.js` (`router.put('/:id', authenticateToken, requireRole('admin'), updateProduct)`)
- Controller: `server/src/controllers/product.controller.js` (Function: `updateProduct(req, res, next)`)

---

### Flow 13: Admin Delete Product Flow (ACTUAL)

```
[ Browser Client ]
        |
        v Admin clicks "Delete" on product row & confirms modal at /admin/products
[ client/src/pages/AdminProductsPage.jsx ]
        |
        v Calls service deleteProduct(id)
[ client/src/services/productService.js ]
        |
        v Sends HTTP Request: DELETE /api/products/:id (Header: Authorization: Bearer <admin_token>)
[ server/src/routes/product.routes.js ]
        |
        +---> Middleware 1: authenticateToken
        +---> Middleware 2: requireRole('admin')
        |
        v Delegate: router.delete('/:id', authenticateToken, requireRole('admin'), deleteProduct)
[ server/src/controllers/product.controller.js ]
        |
        v Function: deleteProduct(req, res, next)
        |
        +---> Step 1: Validates parsePositiveInt(req.params.id)
        +---> Step 2: Checks existence SELECT id FROM products WHERE id = $1 (If missing: returns 404)
        +---> Step 3: Inspects order history reference SELECT COUNT(*) FROM order_items WHERE product_id = $1
        |             (If count > 0: Returns HTTP 409 Conflict protecting historical order integrity)
        +---> Step 4: Executes DELETE FROM products WHERE id = $1
        +---> Step 5: Returns HTTP 200 OK { status: 'success', data: { id } }
[ client/src/pages/AdminProductsPage.jsx ]
        |
        v Shows notice banner and refreshes product table fetchAdminProducts()
```

**Actual Code Execution Path**:
- Page: `client/src/pages/AdminProductsPage.jsx` (Function: `handleExecuteDelete()`)
- Service: `client/src/services/productService.js` (Function: `deleteProduct(id)`)
- Route: `server/src/routes/product.routes.js` (`router.delete('/:id', authenticateToken, requireRole('admin'), deleteProduct)`)
- Controller: `server/src/controllers/product.controller.js` (Function: `deleteProduct(req, res, next)`)

---

### Flow 14: Admin Authorization Flow (ACTUAL)

```
[ Protected Admin HTTP Request ]
        |
        v HTTP Request (e.g. POST /api/products) Header: Authorization: Bearer <token>
[ server/src/middleware/authMiddleware.js ]
        |
        v authenticateToken(req, res, next)
        |---> Verifies JWT signature via jwt.verify(token, JWT_SECRET)
        |---> Attaches decoded user payload to req.user = { userId, email, role }
        |---> Calls next()
        |
[ server/src/middleware/rbacMiddleware.js ]
        |
        v requireRole('admin')(req, res, next)
        |---> Asserts req.user exists
        |---> Checks allowedRoles.includes(req.user.role)
        |     - IF req.user.role === 'admin': Calls next() -> Controller executes
        |     - IF req.user.role === 'user': Responds HTTP 403 Forbidden ("Access forbidden. Required role: [admin]...")
        |     - IF token missing or invalid: Responds HTTP 401 Unauthorized
```

**Actual Code Execution Path**:
- Security Pipeline: `authenticateToken` -> `requireRole('admin')` -> Controller Handler
- Middleware 1: `server/src/middleware/authMiddleware.js` (`authenticateToken`)
- Middleware 2: `server/src/middleware/rbacMiddleware.js` (`requireRole('admin')`)

---

## 2. Planned Application Flows (Phase 4+)

> **Status: PLANNED (Not yet implemented)**

- Cart Sync Operations (`GET /api/cart`, `POST /api/cart`, `DELETE /api/cart/:id`)
- Transactional Order Checkout (`POST /api/orders`)
- Admin Order Management (`GET /api/orders`, `PATCH /api/orders/:id/status`)


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

---

## 2. Phase 4 Application Flows (Shopping Cart, Checkout, & Order Management)

### Flow 10: Authenticated & Guest Cart Operations
```
[ User Interaction: Click "Add to Cart" ]
        |
        v Check Auth Context (user, token)
        |
        +---> If GUEST:
        |     +---> Read localStorage ('ecommerce_guest_cart')
        |     +---> Validate requested qty against product stock
        |     +---> Update local state array & persist back to localStorage ('ecommerce_guest_cart')
        |     +---> Update totalItemCount & cartTotal in CartContext
        |
        +---> If AUTHENTICATED:
              +---> Call POST /api/cart (Header: Authorization: Bearer <jwt>)
              |     [ server/src/routes/cart.routes.js ]
              |             |
              |             +---> authenticateToken middleware (verifies JWT, populates req.user.userId)
              |             +---> cart.controller.js (addToCart)
              |                     |
              |                     +---> Query product stock: SELECT id, name, price, stock FROM products WHERE id = $1
              |                     +---> Query existing cart item: SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2
              |                     +---> If item exists: UPSERT new total quantity (capped at product stock)
              |                     +---> Else: INSERT INTO cart_items (user_id, product_id, quantity)
              |                     +---> Return HTTP 200 OK with updated cart item
              +---> Re-fetch fresh cart via GET /api/cart
              +---> Update CartContext state
```

### Flow 11: Guest Cart Login Merge Execution
```
[ User Action: Submit Login Form ]
        |
        v authService.loginUser(email, password)
        |
        +---> Server returns HTTP 200 OK with JWT token & User details
        +---> AuthContext updates token in localStorage and sets user state
        |
        v CartContext useEffect detects user login event
        |
        +---> Check if localStorage contains 'ecommerce_guest_cart'
        +---> If items present:
        |     +---> Iterate through each guest item ({ product_id, quantity })
        |     +---> Invoke POST /api/cart to merge each item into account database cart
        |     +---> Server combines quantities up to maximum available stock in PostgreSQL
        |     +---> Clear 'ecommerce_guest_cart' from localStorage ONLY AFTER merge completes
        |
        +---> Fetch updated account database cart via GET /api/cart
        +---> Update CartContext state with authoritative PostgreSQL cart items
```

### Flow 12: Transactional Order Checkout Execution
```
[ User Action: Submit Checkout Form at /checkout ]
        |
        v Call POST /api/orders (Body: { shippingAddress })
[ server/src/routes/order.routes.js ]
        |
        +---> authenticateToken middleware (populates req.user.userId)
        +---> order.controller.js (createOrder)
                |
                +---> Acquire database client: const client = await pool.connect()
                +---> Execute: await client.query('BEGIN')
                |
                +---> Fetch cart items with row locking:
                |     SELECT c.product_id, c.quantity, p.name, p.price, p.stock
                |     FROM cart_items c JOIN products p ON c.product_id = p.id
                |     WHERE c.user_id = $1 FOR UPDATE
                |
                +---> Validate cart is not empty & stock for all items >= requested quantity
                |     (If validation fails: ROLLBACK & return 400 error)
                |
                +---> Insert Order record:
                |     INSERT INTO orders (user_id, total_amount, shipping_address, status)
                |     VALUES ($1, $2, $3, 'PENDING') RETURNING id
                |
                +---> Insert line items & decrement product stock:
                |     FOR EACH item:
                |       INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
                |       UPDATE products SET stock = stock - quantity WHERE id = product_id
                |
                +---> Clear user's cart:
                |     DELETE FROM cart_items WHERE user_id = $1
                |
                +---> Execute: await client.query('COMMIT')
                +---> Release database client: client.release()
                |
                v Return HTTP 201 Created with order details
[ client/src/pages/CheckoutPage.jsx ]
        |
        +---> Refresh CartContext state (clears cart in UI)
        +---> Navigate to /order-confirmation/:orderId
```

### Flow 13: Admin Order Status & Stock Restoration Path
```
[ Admin Action: Change Order Status to 'CANCELLED' at /admin/orders ]
        |
        v Call PATCH /api/orders/:id/status (Body: { status: 'CANCELLED' })
[ server/src/routes/order.routes.js ]
        |
        +---> authenticateToken middleware
        +---> requireRole('admin') middleware
        +---> order.controller.js (updateOrderStatusAdmin)
                |
                +---> Check previous order status in DB
                +---> If changing to CANCELLED from non-cancelled status:
                |     +---> Acquire database client & BEGIN transaction
                |     +---> SELECT product_id, quantity FROM order_items WHERE order_id = $1
                |     +---> FOR EACH item: UPDATE products SET stock = stock + quantity WHERE id = product_id
                |     +---> UPDATE orders SET status = 'CANCELLED' WHERE id = $1
                |     +---> COMMIT transaction & release client
                |
                +---> Else:
                      +---> UPDATE orders SET status = $1 WHERE id = $2
                |
                v Return HTTP 200 OK with updated order details and stock restoration notification
```

