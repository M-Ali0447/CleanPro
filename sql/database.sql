-- CLEANPRO MA'LUMOTLAR BAZASI

-- 1. FOYDALANUVCHILAR JADVALI
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. BUYURTMALAR JADVALI
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    service_type VARCHAR(50) NOT NULL,
    order_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. FIKRLAR JADVALI
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL,
    rating INTEGER NOT NULL,
    review_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TEST MA'LUMOTLARNI QO'SHISH
INSERT INTO reviews (user_name, rating, review_text) VALUES 
('Test Foydalanuvchi', 5, 'Bu test fikr. Hammasi juda yaxshi!'),
('Ikkinchi Mijoz', 4, 'Sifatli xizmat, tavsiya etaman.');
