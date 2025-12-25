// ==================== ES MODULE VERSION ====================
import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import logger, { authLogger, dbLogger, apiLogger, businessLogger, securityLogger } from './logger.js';
import {
    globalLimiter,
    loginLimiter,
    publicApiLimiter,
    orderCreationLimiter,
    reviewCreationLimiter,
    adminApiLimiter,
    adminCreationLimiter
} from './rateLimiter.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5006;

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// CORS Configuration
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:5006', 'http://127.0.0.1:5006'];

// ========== MIDDLEWARE ==========
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
            const msg = '❌ CORS policy: This origin is not allowed to access the resource.';
            securityLogger.corsBlocked(origin);
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// RATE LIMITING - Global limiter for all requests
app.use(globalLimiter);

// STATIC FILES
app.use(express.static(__dirname));

// ========== DATABASE ==========
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    port: parseInt(process.env.DB_PORT) || 5432,
    ssl: false
});

// Database tekshirish
async function testDatabase() {
    try {
        const client = await pool.connect();
        console.log('✅ DATABASE ULANDI');
        dbLogger.connected();
        client.release();
        return true;
    } catch (error) {
        console.error('\n❌ DATABASE XATOSI:', error.message);
        console.log('\n📌 YECHIM:');
        console.log('   1. sudo service postgresql start');
        console.log('   2. sudo -u postgres psql -c "ALTER USER postgres PASSWORD \'1234\';"');
        dbLogger.disconnected(error);
        logger.error('Database connection failed', { error: error.message });
        return false;
    }
}

async function initializeDatabase() {
    try {
        console.log('📦 Jadvallar yaratilmoqda...');
        logger.info('Initializing database tables...');

        // Yangi jadvallarni yaratish
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(20) NOT NULL UNIQUE,
                email VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                service_type VARCHAR(100) NOT NULL,
                order_date DATE NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                user_name VARCHAR(100) NOT NULL,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                review_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(100),
                role VARCHAR(20) DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Bosh admin qo'shish (hashed password)
        const admin = await pool.query("SELECT * FROM admins WHERE username = 'admin'");
        if (admin.rows.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(`
                INSERT INTO admins (username, password, full_name, email, role)
                VALUES ('admin', $1, 'Super Admin', 'admin@cleanpro.uz', 'super_admin')
            `, [hashedPassword]);
            console.log('✅ Admin yaratildi: admin / admin123');
            logger.info('Default super admin created', { username: 'admin' });
        }

        console.log('✅ Jadvallar tayyor');
        logger.info('Database initialization completed successfully');
    } catch (error) {
        console.error('❌ INIT ERROR:', error);
        logger.error('Database initialization failed', { error: error.message, stack: error.stack });
        process.exit(1);
    }
}

// ========== AUTH Middleware ==========
async function verifyAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        authLogger.tokenFailed('No authorization header');
        return res.status(401).json({ success: false, message: '❌ Kirish taqiqlangan!' });
    }

    try {
        const token = authHeader.split(' ')[1];

        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET);

        req.adminId = decoded.adminId;
        req.adminRole = decoded.role;
        req.adminUsername = decoded.username;

        authLogger.tokenVerified(req.adminId, req.adminUsername);
        next();
    } catch (error) {
        console.error('Auth error:', error);
        authLogger.tokenFailed(error.message);
        logger.error('Authentication failed', { error: error.message });

        // Provide specific error messages for JWT errors
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: '❌ Token muddati tugagan!' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: '❌ Token noto\'g\'ri!' });
        }

        return res.status(401).json({ success: false, message: '❌ Autentifikatsiya xatosi!' });
    }
}

// Super admin only middleware
function verifySuperAdmin(req, res, next) {
    if (req.adminRole !== 'super_admin') {
        return res.status(403).json({ success: false, message: '❌ Faqat super admin!' });
    }
    next();
}

// ========== API ROUTES ==========

// HEALTH CHECK
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ 
            success: true, 
            message: '🟢 Server ishdamiqda', 
            database: '✅ Ulandi',
            timestamp: new Date().toISOString()
        });
    } catch {
        res.status(500).json({ success: false, message: '🔴 Database ulanmagan' });
    }
});

// CREATE ORDER (Public) - BU ENG MUHIM QISMI
app.post('/api/orders', orderCreationLimiter, async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('📥 ORDER QABUL QILINMOQDA:', req.body);

    try {
        const { name, phone, service_type, date, notes } = req.body;

        if (!name || !phone || !service_type || !date) {
            logger.warn('Order creation failed - missing fields', { name, phone, service_type, date, ip });
            return res.status(400).json({
                success: false,
                message: '⚠️ Barcha maydonlarni to\'ldiring!'
            });
        }

        // Telefon formatini tekshirish
        const cleanedPhone = phone.replace(/\D/g, '');
        const formattedPhone = cleanedPhone.startsWith('998') ? '+998' + cleanedPhone.slice(3) : '+998' + cleanedPhone;

        if (!formattedPhone.match(/^\+998\d{9}$/)) {
            logger.warn('Order creation failed - invalid phone format', { phone, formattedPhone, ip });
            return res.status(400).json({
                success: false,
                message: '☎️ Telefon formati: +998901234567'
            });
        }

        // Foydalanuvchini topish yoki yaratish
        let user;
        try {
            user = await pool.query('SELECT id FROM users WHERE phone = $1', [formattedPhone]);
        } catch (err) {
            console.log('⚠️ User query error, creating new user...');
            logger.warn('User query error', { error: err.message });
            user = { rows: [] };
        }

        let userId;
        if (user.rows.length === 0) {
            const newUser = await pool.query(
                'INSERT INTO users (name, phone) VALUES ($1, $2) RETURNING id',
                [name, formattedPhone]
            );
            userId = newUser.rows[0].id;
            console.log('👤 Yangi foydalanuvchi yaratildi:', userId);
            logger.info('New user created', { userId, phone: formattedPhone });
        } else {
            userId = user.rows[0].id;
            console.log('👤 Mavjud foydalanuvchi:', userId);
        }

        // Buyurtmani saqlash
        const orderResult = await pool.query(`
            INSERT INTO orders (user_id, name, phone, service_type, order_date, notes, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'pending')
            RETURNING *
        `, [userId, name, formattedPhone, service_type, date, notes || '']);

        const savedOrder = orderResult.rows[0];
        console.log('✅ BUYURTMA SAQLANDI:', savedOrder.id);
        businessLogger.orderCreated(savedOrder.id, userId, service_type);
        logger.info('Order created successfully', { orderId: savedOrder.id, userId, serviceType: service_type, ip });

        res.json({
            success: true,
            message: '✅ BUYURTMA QABUL QILINDI! Operatorlar tez orada siz bilan bog\'lanadi.',
            order: savedOrder
        });

    } catch (error) {
        console.error('❌ ORDER ERROR:', error);
        logger.error('Order creation error', { error: error.message, stack: error.stack, ip });
        res.status(500).json({
            success: false,
            message: '🔥 Server xatosi yuz berdi!',
            error: error.message
        });
    }
});

// GET ORDERS (Public test uchun)
app.get('/api/orders', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 10');
        res.json({ success: true, orders: result.rows });
    } catch (error) {
        console.error('❌ GET ORDERS ERROR:', error);
        res.status(500).json({ success: false, message: '🔥 Xatolik yuz berdi!' });
    }
});

// CREATE REVIEW (Public)
app.post('/api/reviews', reviewCreationLimiter, async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('📥 REVIEW QABUL QILINMOQDA:', req.body);

    try {
        const { user_name, rating, review_text } = req.body;

        if (!user_name || !rating || !review_text) {
            logger.warn('Review creation failed - missing fields', { user_name, rating, ip });
            return res.status(400).json({
                success: false,
                message: '⚠️ Barcha maydonlarni to\'ldiring!'
            });
        }

        const ratingNum = parseInt(rating);
        if (ratingNum < 1 || ratingNum > 5) {
            logger.warn('Review creation failed - invalid rating', { rating: ratingNum, ip });
            return res.status(400).json({
                success: false,
                message: '⭐ Reyting 1-5 oralig\'ida!'
            });
        }


        const result = await pool.query(`
            INSERT INTO reviews (user_name, rating, review_text)
            VALUES ($1, $2, $3) RETURNING *
        `, [user_name, ratingNum, review_text]);

        const savedReview = result.rows[0];
        console.log('✅ REVIEW SAQLANDI:', savedReview.id);
        businessLogger.reviewCreated(savedReview.id, user_name, ratingNum);
        logger.info('Review created successfully', {
            reviewId: savedReview.id,
            userName: user_name,
            rating: ratingNum,
            ip
        });

        res.json({
            success: true,
            message: '✅ Fikr qabul qilindi!',
            review: savedReview
        });

    } catch (error) {
        console.error('❌ REVIEW ERROR:', error);
        logger.error('Review creation error', { error: error.message, stack: error.stack, ip });
        res.status(500).json({
            success: false,
            message: '🔥 Server xatosi yuz berdi!'
        });
    }
});

// GET REVIEWS (Public)
app.get('/api/reviews', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC LIMIT 20');
        res.json({ success: true, reviews: result.rows });
    } catch (error) {
        console.error('❌ GET REVIEWS ERROR:', error);
        res.status(500).json({ success: false, message: '🔥 Xatolik yuz berdi!' });
    }
});

// ========== ADMIN ROUTES ==========

// ADMIN LOGIN
app.post('/api/admin/login', loginLimiter, async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    try {
        const { username, password } = req.body;

        if (!username || !password) {
            authLogger.login(username || 'unknown', false, ip);
            return res.status(400).json({
                success: false,
                message: '⚠️ Login va parolni kiriting!'
            });
        }

        // Get admin with password
        const result = await pool.query(
            `SELECT id, username, password, full_name, email, role FROM admins WHERE username = $1`,
            [username]
        );

        if (result.rows.length === 0) {
            authLogger.login(username, false, ip);
            logger.warn('Failed login attempt - user not found', { username, ip });
            return res.status(401).json({
                success: false,
                message: '❌ LOGIN YOKI PAROL NOTO\'G\'RI!'
            });
        }

        const admin = result.rows[0];

        // Compare password with bcrypt
        const passwordMatch = await bcrypt.compare(password, admin.password);

        if (!passwordMatch) {
            authLogger.login(username, false, ip);
            logger.warn('Failed login attempt - wrong password', { username, ip });
            return res.status(401).json({
                success: false,
                message: '❌ LOGIN YOKI PAROL NOTO\'G\'RI!'
            });
        }

        // Login successful
        authLogger.login(username, true, ip);
        logger.info('Successful login', { username, role: admin.role, ip });

        // Generate JWT token
        const token = jwt.sign(
            {
                adminId: admin.id,
                username: admin.username,
                role: admin.role
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Remove password from response
        delete admin.password;

        res.json({
            success: true,
            message: '✅ XUSH KELIBSIZ!',
            token: token,
            admin: admin
        });

    } catch (error) {
        console.error('❌ LOGIN ERROR:', error);
        logger.error('Login error', { error: error.message, stack: error.stack });
        res.status(500).json({
            success: false,
            message: '🔥 Server xatosi yuz berdi!'
        });
    }
});

// ADMIN STATS
app.get('/api/admin/stats', verifyAdmin, adminApiLimiter, async (req, res) => {
    try {
        const [orders, pending, reviews, users] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM orders'),
            pool.query("SELECT COUNT(*) FROM orders WHERE status = 'pending'"),
            pool.query('SELECT COUNT(*) FROM reviews'),
            pool.query('SELECT COUNT(*) FROM users')
        ]);

        res.json({
            success: true,
            stats: {
                totalOrders: parseInt(orders.rows[0].count),
                pendingOrders: parseInt(pending.rows[0].count),
                totalReviews: parseInt(reviews.rows[0].count),
                totalUsers: parseInt(users.rows[0].count)
            }
        });
    } catch (error) {
        console.error('❌ STATS ERROR', error);
        res.status(500).json({ success: false, message: '🔥 Xatolik yuz berdi!' });
    }
});

// WEEKLY STATS FOR CHART
app.get('/api/admin/stats/weekly', verifyAdmin, async (req, res) => {
    try {
        // Get orders from last 7 days
        const result = await pool.query(`
            SELECT
                DATE(created_at) as date,
                COUNT(*) as count
            FROM orders
            WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        // Create array for last 7 days
        const weekData = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Find count for this date
            const dayData = result.rows.find(row => {
                const rowDate = new Date(row.date).toISOString().split('T')[0];
                return rowDate === dateStr;
            });

            weekData.push({
                date: dateStr,
                count: dayData ? parseInt(dayData.count) : 0
            });
        }

        res.json({
            success: true,
            data: weekData
        });
    } catch (error) {
        console.error('❌ WEEKLY STATS ERROR', error);
        res.status(500).json({ success: false, message: '🔥 Xatolik yuz berdi!' });
    }
});

// ADMIN ORDERS
app.get('/api/admin/orders', verifyAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        res.json({ success: true, orders: result.rows });
    } catch (error) {
        console.error('❌ ORDERS ERROR', error);
        res.status(500).json({ success: false, message: '🔥 Xatolik yuz berdi!' });
    }
});

// ADMIN REVIEWS
app.get('/api/admin/reviews', verifyAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC');
        res.json({ success: true, reviews: result.rows });
    } catch (error) {
        console.error('❌ REVIEWS ERROR', error);
        res.status(500).json({ success: false, message: '🔥 Xatolik yuz berdi!' });
    }
});

// ADMIN USERS
app.get('/api/admin/users', verifyAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.*, COUNT(o.id) as order_count 
            FROM users u 
            LEFT JOIN orders o ON u.id = o.user_id 
            GROUP BY u.id 
            ORDER BY u.created_at DESC
        `);
        res.json({ success: true, users: result.rows });
    } catch (error) {
        console.error('❌ USERS ERROR', error);
        res.status(500).json({ success: false, message: '🔥 Xatolik yuz berdi!' });
    }
});

// UPDATE ORDER STATUS
app.put('/api/admin/orders/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: '❌ Noto\'g\'ri holat!'
            });
        }

        // Get old status first
        const oldOrder = await pool.query('SELECT status FROM orders WHERE id = $1', [id]);
        const oldStatus = oldOrder.rows[0]?.status;

        const result = await pool.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length > 0) {
            businessLogger.orderUpdated(parseInt(id), oldStatus, status, req.adminId);
            logger.info('Order status updated', {
                orderId: id,
                oldStatus,
                newStatus: status,
                updatedBy: req.adminId,
                updatedByUsername: req.adminUsername
            });
        }

        res.json({
            success: true,
            message: '✅ Holat yangilandi!',
            order: result.rows[0]
        });
    } catch (error) {
        console.error('❌ UPDATE ERROR', error);
        logger.error('Order update error', {
            error: error.message,
            orderId: req.params.id,
            updatedBy: req.adminId
        });
        res.status(500).json({ success: false, message: '🔥 Xatolik yuz berdi!' });
    }
});

// DELETE ORDER
app.delete('/api/admin/orders/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length > 0) {
            businessLogger.orderDeleted(parseInt(id), req.adminId);
            logger.warn('Order deleted', {
                orderId: id,
                deletedBy: req.adminId,
                deletedByUsername: req.adminUsername
            });
        }

        res.json({ success: true, message: '✅ Buyurtma o\'chirildi!' });
    } catch (error) {
        console.error('❌ DELETE ERROR', error);
        logger.error('Order deletion error', {
            error: error.message,
            orderId: req.params.id,
            deletedBy: req.adminId
        });
        res.status(500).json({ success: false, message: '🔥 Xatolik yuz berdi!' });
    }
});

// DELETE REVIEW
app.delete('/api/admin/reviews/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM reviews WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length > 0) {
            businessLogger.reviewDeleted(parseInt(id), req.adminId);
            logger.warn('Review deleted', {
                reviewId: id,
                deletedBy: req.adminId,
                deletedByUsername: req.adminUsername
            });
        }

        res.json({ success: true, message: '✅ Fikr o\'chirildi!' });
    } catch (error) {
        console.error('❌ DELETE ERROR', error);
        logger.error('Review deletion error', {
            error: error.message,
            reviewId: req.params.id,
            deletedBy: req.adminId
        });
        res.status(500).json({ success: false, message: '🔥 Xatolik yuz berdi!' });
    }
});

// ========== ADMIN MANAGEMENT (Super Admin Only) ==========

// GET CURRENT ADMIN INFO
app.get('/api/admin/me', verifyAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, full_name, email, role, created_at FROM admins WHERE id = $1',
            [req.adminId]
        );
        res.json({ success: true, admin: result.rows[0] });
    } catch (error) {
        console.error('❌ GET ADMIN ERROR', error);
        res.status(500).json({ success: false, message: '🔥 Xatolik yuz berdi!' });
    }
});

// GET ALL ADMINS (Super Admin Only)
app.get('/api/admin/admins', verifyAdmin, verifySuperAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, full_name, email, role, created_at FROM admins ORDER BY created_at DESC'
        );
        res.json({ success: true, admins: result.rows });
    } catch (error) {
        console.error('❌ GET ADMINS ERROR', error);
        res.status(500).json({ success: false, message: '🔥 Xatolik yuz berdi!' });
    }
});

// CREATE NEW ADMIN (Super Admin Only)
app.post('/api/admin/admins', verifyAdmin, verifySuperAdmin, adminCreationLimiter, async (req, res) => {
    try {
        const { username, password, full_name, email, role } = req.body;

        if (!username || !password || !full_name) {
            return res.status(400).json({
                success: false,
                message: '⚠️ Username, password va full_name majburiy!'
            });
        }

        // Check if username exists
        const existing = await pool.query('SELECT id FROM admins WHERE username = $1', [username]);
        if (existing.rows.length > 0) {
            logger.warn('Admin creation failed - username exists', {
                username,
                createdBy: req.adminId
            });
            return res.status(400).json({
                success: false,
                message: '❌ Bu username allaqachon mavjud!'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(`
            INSERT INTO admins (username, password, full_name, email, role)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, username, full_name, email, role, created_at
        `, [username, hashedPassword, full_name, email || null, role || 'admin']);

        const newAdmin = result.rows[0];

        businessLogger.adminCreated(newAdmin.id, username, newAdmin.role, req.adminId);
        logger.info('Admin created successfully', {
            adminId: newAdmin.id,
            username,
            role: newAdmin.role,
            createdBy: req.adminId,
            createdByUsername: req.adminUsername
        });

        res.json({
            success: true,
            message: '✅ Admin yaratildi!',
            admin: newAdmin
        });
    } catch (error) {
        console.error('❌ CREATE ADMIN ERROR', error);
        logger.error('Admin creation error', {
            error: error.message,
            stack: error.stack,
            createdBy: req.adminId
        });
        res.status(500).json({ success: false, message: '🔥 Xatolik yuz berdi!' });
    }
});

// UPDATE ADMIN (Super Admin Only)
app.put('/api/admin/admins/:id', verifyAdmin, verifySuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, full_name, email, role } = req.body;
        
        // Prevent editing super_admin role or deleting yourself
        if (parseInt(id) === req.adminId && role !== 'super_admin') {
            return res.status(400).json({ 
                success: false, 
                message: '❌ O\'zingizning rolingizni o\'zgartira olmaysiz!' 
            });
        }
        
        // Check if username exists (if changed)
        if (username) {
            const existing = await pool.query(
                'SELECT id FROM admins WHERE username = $1 AND id != $2', 
                [username, id]
            );
            if (existing.rows.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: '❌ Bu username allaqachon mavjud!' 
                });
            }
        }
        
        // Build update query dynamically
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (username) {
            updates.push(`username = $${paramCount++}`);
            values.push(username);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push(`password = $${paramCount++}`);
            values.push(hashedPassword);
        }
        if (full_name) {
            updates.push(`full_name = $${paramCount++}`);
            values.push(full_name);
        }
        if (email !== undefined) {
            updates.push(`email = $${paramCount++}`);
            values.push(email);
        }
        if (role) {
            updates.push(`role = $${paramCount++}`);
            values.push(role);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: '⚠️ Yangilanish uchun ma\'lumot kerak!' 
            });
        }
        
        values.push(id);
        const query = `UPDATE admins SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, username, full_name, email, role, created_at`;

        const result = await pool.query(query, values);

        if (result.rows.length > 0) {
            businessLogger.adminUpdated(parseInt(id), result.rows[0].username, req.adminId);
            logger.info('Admin updated', {
                adminId: id,
                username: result.rows[0].username,
                updatedBy: req.adminId,
                updatedByUsername: req.adminUsername
            });
        }

        res.json({
            success: true,
            message: '✅ Admin yangilandi!',
            admin: result.rows[0]
        });
    } catch (error) {
        console.error('❌ UPDATE ADMIN ERROR', error);
        logger.error('Admin update error', {
            error: error.message,
            adminId: req.params.id,
            updatedBy: req.adminId
        });
        res.status(500).json({ success: false, message: '🔥 Xatolik yuz berdi!' });
    }
});

// DELETE ADMIN (Super Admin Only)
app.delete('/api/admin/admins/:id', verifyAdmin, verifySuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent deleting yourself
        if (parseInt(id) === req.adminId) {
            return res.status(400).json({
                success: false,
                message: '❌ O\'zingizni o\'chira olmaysiz!'
            });
        }

        // Check if admin exists and get username
        const admin = await pool.query('SELECT username, role FROM admins WHERE id = $1', [id]);
        if (admin.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '❌ Admin topilmadi!'
            });
        }

        const deletedUsername = admin.rows[0].username;

        await pool.query('DELETE FROM admins WHERE id = $1', [id]);

        businessLogger.adminDeleted(parseInt(id), deletedUsername, req.adminId);
        logger.warn('Admin deleted', {
            adminId: id,
            username: deletedUsername,
            deletedBy: req.adminId,
            deletedByUsername: req.adminUsername
        });

        res.json({ success: true, message: '✅ Admin o\'chirildi!' });
    } catch (error) {
        console.error('❌ DELETE ADMIN ERROR', error);
        logger.error('Admin deletion error', {
            error: error.message,
            adminId: req.params.id,
            deletedBy: req.adminId
        });
        res.status(500).json({ success: false, message: '🔥 Xatolik yuz berdi!' });
    }
});

// ========== STATIC FILES ==========
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'clean.html'));
});

app.get('/clean.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'clean.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// ========== SERVER START ==========
(async () => {
    console.log('\n🔄 Server ishga tushirilmoqda...');
    
    const dbConnected = await testDatabase();
    if (!dbConnected) {
        console.log('\n❌ SERVER TO\'XTATILDI! Postgres ishlamayapti.\n');
        process.exit(1);
    }

    await initializeDatabase();

    app.listen(PORT, '0.0.0.0', () => {
        console.log('\n═══════════════════════════════════════════════════');
        console.log(`🚀 SERVER ISHGA TUSHDI: http://localhost:${PORT}`);
        console.log(`🏠 CLEAN SITE: http://localhost:${PORT}/clean.html`);
        console.log(`🔐 ADMIN PANEL: http://localhost:${PORT}/admin.html`);
        console.log('═══════════════════════════════════════════════════');
        console.log('📌 TEST: http://localhost:' + PORT + '/api/health');
        console.log('📌 TEST ORDERS: http://localhost:' + PORT + '/api/orders');
        console.log('═══════════════════════════════════════════════════\n');
    });
})();
