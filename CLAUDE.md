# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CleanPro is a cleaning services booking platform built with Node.js, Express, and PostgreSQL. It features a public-facing website for customers to book cleaning services and submit reviews, plus an admin panel for managing orders, reviews, and users. The application supports multilingual content (Uzbek Latin, Uzbek Cyrillic, Russian).

## Technology Stack

- **Backend**: Node.js with Express.js (ES modules)
- **Database**: PostgreSQL
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Key Dependencies**: pg (PostgreSQL client), cors, express, bcrypt, jsonwebtoken, winston (logging), express-rate-limit

## Development Commands

```bash
# Install dependencies
npm install

# Start the server (runs on port 5006)
npm start

# Create/verify admin account
node createAdmin.js

# Migrate passwords to bcrypt (if needed)
node migratePasswords.js
```

## Database Setup

The application requires PostgreSQL to be running locally. The server automatically initializes the database schema on startup.

**Connection Details** (configured via environment variables or defaults in server.js:68-75):
- User: postgres (or DB_USER)
- Host: localhost (or DB_HOST)
- Database: postgres (or DB_NAME)
- Password: 1234 (or DB_PASSWORD)
- Port: 5432 (or DB_PORT)

**Database Initialization**:
- On server startup, the `initializeDatabase()` function (server.js:96-167) automatically creates required tables
- Default super admin is created with hashed password: username `admin`, password `admin123`
- Schema includes: users, orders, reviews, admins tables

**Manual Database Setup** (if needed):
```bash
# Start PostgreSQL service
sudo service postgresql start

# Set postgres user password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '1234';"

# Optional: Use the SQL schema
psql -U postgres -f sql/database.sql
```

## Architecture

### Server Structure (server.js)

The main server file follows this organization:

1. **Environment & Configuration** (lines 22-38):
   - Loads .env variables via dotenv
   - JWT configuration (JWT_SECRET, JWT_EXPIRES_IN)
   - CORS allowed origins (configurable via ALLOWED_ORIGINS environment variable)

2. **Middleware Setup** (lines 40-65):
   - CORS with origin whitelist validation
   - JSON body parser with 10mb limit
   - Global rate limiter
   - Static file serving from root directory

3. **Database Layer** (lines 67-167):
   - PostgreSQL connection pool with environment-based configuration
   - `testDatabase()` - Verifies database connectivity on startup
   - `initializeDatabase()` - Creates tables and default admin with bcrypt-hashed password

4. **Authentication Middleware** (lines 169-211):
   - `verifyAdmin(req, res, next)` - JWT token validation for admin routes (extracts adminId, adminRole, adminUsername from token)
   - `verifySuperAdmin(req, res, next)` - Restricts access to super_admin role only
   - Token format: JWT with payload {adminId, username, role}, signed with JWT_SECRET, expires in JWT_EXPIRES_IN

5. **API Route Structure**:
   - **Public Routes** (lines 215-395): `/api/health`, `/api/orders`, `/api/reviews` - No authentication required
   - **Admin Routes** (lines 478-688): `/api/admin/*` - Require `verifyAdmin` middleware
   - **Super Admin Routes** (lines 706-917): `/api/admin/admins/*` - Require both `verifyAdmin` and `verifySuperAdmin`

6. **Logging & Rate Limiting**:
   - Winston-based logging system (logger.js) with specialized loggers: authLogger, dbLogger, apiLogger, securityLogger, businessLogger
   - Express-rate-limit based rate limiting (rateLimiter.js) with different limits for different endpoints
   - Logs stored in logs/ directory: combined.log, error.log, auth.log, database.log

### Frontend Architecture

**Customer Site** (clean.html):
- Single-page application with sections: hero, services, testimonials, about, contact
- Quick order form in hero section
- Review submission form
- Language switcher (Uzbek Latin/Cyrillic, Russian) in header

**Admin Panel** (admin.html):
- Login page with JWT authentication
- Dashboard with statistics cards and weekly chart
- Sidebar navigation for: Orders, Reviews, Users, Stats, Admins (super admin only)
- Role-based UI (super_admin sees admin management section)

**JavaScript Files**:
- `clean.js` - Customer site logic: form handling, review loading, language switching, responsive menu
- `admin.js` - Admin panel: JWT authentication, CRUD operations, statistics display with Chart.js
- `translations.js` - Multi-language content definitions (uz_latn, uz_cyrl, ru)
- `adminTranslations.js` - Admin panel translations
- `responsive-helpers.js` - Mobile responsiveness utilities

### Database Schema

**users** table:
- id (SERIAL PRIMARY KEY)
- name, phone (UNIQUE), email
- created_at

**orders** table:
- id (SERIAL PRIMARY KEY)
- user_id (FK to users)
- name, phone, service_type, order_date
- status ('pending', 'completed', 'cancelled')
- notes, created_at

**reviews** table:
- id (SERIAL PRIMARY KEY)
- user_name, rating (1-5), review_text
- created_at

**admins** table:
- id (SERIAL PRIMARY KEY)
- username (UNIQUE), password (bcrypt hashed)
- full_name, email
- role ('admin', 'super_admin')
- created_at

## Important Patterns and Conventions

### Phone Number Handling
The application normalizes phone numbers to Uzbek format (+998XXXXXXXXX):
```javascript
// Example from server.js:247-248
const cleanedPhone = phone.replace(/\D/g, '');
const formattedPhone = cleanedPhone.startsWith('998') ? '+998' + cleanedPhone.slice(3) : '+998' + cleanedPhone;
```

### Order Creation Flow (server.js:231-309)
1. Validate required fields (name, phone, service_type, date)
2. Normalize and validate phone format (+998XXXXXXXXX)
3. Check if user exists by phone, create if not
4. Insert order with 'pending' status
5. Log business event
6. Return order confirmation

### Admin Authentication Flow
1. Login (POST `/api/admin/login`): Validates credentials with bcrypt, generates JWT token
2. Token stored in localStorage as 'adminToken'
3. Protected routes expect `Authorization: Bearer <token>` header
4. Middleware verifies JWT, extracts admin ID and role
5. Role-based access control for super admin features

### Translation System
The `translations.js` file contains nested objects for each language (uz_latn, uz_cyrl, ru). Frontend JavaScript:
1. Detects current language from localStorage (default: 'uz_latn')
2. Updates all elements with `data-translate-key` attributes
3. Language switcher updates localStorage and reloads translations

### Logging System (logger.js)
Winston-based structured logging with multiple specialized loggers:
- **authLogger**: login, logout, token verification events
- **dbLogger**: database queries, connections, errors
- **apiLogger**: API requests, responses, errors
- **securityLogger**: SQL injection attempts, XSS attempts, rate limits, CORS violations
- **businessLogger**: orders, reviews, admin management events

All logs include metadata (type, action, userId, ip, etc.) and are written to logs/ directory.

### Rate Limiting (rateLimiter.js)
Different rate limits for different endpoints:
- **loginLimiter**: 5 attempts per 15 minutes (key: IP + username)
- **orderCreationLimiter**: 10 orders per hour (key: IP + phone)
- **reviewCreationLimiter**: 3 reviews per 24 hours (key: IP)
- **adminApiLimiter**: 100 requests per 15 minutes (key: IP + adminId)
- **adminCreationLimiter**: 5 admin creations per hour (key: IP + adminId)
- **globalLimiter**: 60 requests per minute (key: IP)

## API Endpoints Reference

### Public Endpoints
- `GET /api/health` - Health check with database connectivity test
- `POST /api/orders` - Create new order (requires: name, phone, service_type, date; optional: notes)
- `GET /api/orders` - Get recent orders (public, limit 10)
- `POST /api/reviews` - Submit review (requires: user_name, rating, review_text)
- `GET /api/reviews` - Get recent reviews (limit 20)

### Admin Endpoints (require JWT auth)
- `POST /api/admin/login` - Admin login (returns JWT token)
- `GET /api/admin/me` - Current admin info
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/stats/weekly` - Weekly order chart data (last 7 days)
- `GET /api/admin/orders` - All orders
- `PUT /api/admin/orders/:id` - Update order status
- `DELETE /api/admin/orders/:id` - Delete order
- `GET /api/admin/reviews` - All reviews
- `DELETE /api/admin/reviews/:id` - Delete review
- `GET /api/admin/users` - All users with order counts

### Super Admin Endpoints (require super_admin role)
- `GET /api/admin/admins` - List all admins
- `POST /api/admin/admins` - Create new admin (requires: username, password, full_name; optional: email, role)
- `PUT /api/admin/admins/:id` - Update admin (cannot change own role)
- `DELETE /api/admin/admins/:id` - Delete admin (cannot delete self)

## Environment Variables

The application uses dotenv for configuration. Create a .env file with:

```bash
# Server
PORT=5006

# Database
DB_USER=postgres
DB_HOST=localhost
DB_NAME=postgres
DB_PASSWORD=1234
DB_PORT=5432

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=24h

# CORS
ALLOWED_ORIGINS=http://localhost:5006,http://127.0.0.1:5006

# Logging
LOG_LEVEL=info
NODE_ENV=development

# Rate Limiting (optional)
RATE_LIMIT_WHITELIST=127.0.0.1,::1
```

**Important**: Change JWT_SECRET in production!

## Static Files and Routes

- `/` and `/clean.html` → Customer website
- `/admin.html` → Admin panel
- All CSS, JS, and static assets served from root directory
- Images and other static files served via express.static

## Security Considerations

**Current Implementation**:
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens for authentication
- Rate limiting on all endpoints
- CORS with origin whitelist
- Parameterized SQL queries to prevent SQL injection
- Comprehensive logging for security events

**Production Recommendations**:
- Set strong JWT_SECRET in environment variables
- Configure ALLOWED_ORIGINS to specific domains
- Enable HTTPS/TLS
- Review rate limit thresholds based on usage
- Set up log rotation and monitoring
- Consider adding helmet.js for additional security headers

## Port and Environment Configuration

- Default port: 5006 (configurable via PORT env variable)
- Server binds to '0.0.0.0' for network accessibility
- All configuration via environment variables with sensible defaults
