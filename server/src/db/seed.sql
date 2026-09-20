-- Seed Data for E-Commerce Database (PostgreSQL)
-- Inserts initial sample products into the PostgreSQL products table

INSERT INTO products (id, name, description, price, image_url, category, stock, created_at, updated_at)
VALUES 
(1, 'Wireless Noise-Canceling Headphones', 'High-fidelity audio with active noise cancellation and 30-hour battery life.', 199.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80', 'Electronics', 25, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Ergonomic Mechanical Keyboard', 'Customizable RGB backlighting with hot-swappable tactile mechanical switches.', 129.50, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80', 'Electronics', 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'UltraWide 4K Gaming Monitor', '34-inch curved display with 144Hz refresh rate and HDR400 support.', 499.00, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80', 'Computers', 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Reset primary key auto-increment sequence for products table
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
