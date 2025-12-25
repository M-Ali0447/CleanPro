// ==================== LOGGER SYSTEM ====================
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Создаем директорию для логов
import fs from 'fs';
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Формат для логов
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

        // Добавляем дополнительную информацию
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }

        // Добавляем stack trace для ошибок
        if (stack) {
            log += `\n${stack}`;
        }

        return log;
    })
);

// Создаем основной логгер
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        // Все логи записываются в combined.log
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),

        // Только ошибки записываются в error.log
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),

        // Логи аутентификации в отдельный файл
        new winston.transports.File({
            filename: path.join(logsDir, 'auth.log'),
            level: 'info',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),

        // Логи базы данных
        new winston.transports.File({
            filename: path.join(logsDir, 'database.log'),
            level: 'info',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});

// В режиме разработки также выводим в консоль
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'HH:mm:ss' }),
            winston.format.printf(({ timestamp, level, message }) => {
                return `${timestamp} ${level}: ${message}`;
            })
        )
    }));
}

// Специализированные логгеры для разных частей приложения
export const authLogger = {
    login: (username, success, ip = 'unknown') => {
        const message = `Login attempt: ${username} - ${success ? 'SUCCESS' : 'FAILED'} from ${ip}`;
        logger.info(message, { type: 'auth', action: 'login', username, success, ip });
    },

    logout: (username, ip = 'unknown') => {
        const message = `Logout: ${username} from ${ip}`;
        logger.info(message, { type: 'auth', action: 'logout', username, ip });
    },

    tokenVerified: (userId, username) => {
        logger.info(`Token verified for user: ${username} (ID: ${userId})`, {
            type: 'auth',
            action: 'token_verify',
            userId,
            username
        });
    },

    tokenFailed: (error) => {
        logger.warn(`Token verification failed: ${error}`, {
            type: 'auth',
            action: 'token_verify_failed'
        });
    }
};

export const dbLogger = {
    query: (query, params = []) => {
        logger.debug(`DB Query: ${query}`, { type: 'database', query, params });
    },

    error: (query, error) => {
        logger.error(`DB Error in query: ${query}`, {
            type: 'database',
            query,
            error: error.message,
            stack: error.stack
        });
    },

    connected: () => {
        logger.info('✅ Database connected successfully', { type: 'database' });
    },

    disconnected: (error) => {
        logger.error('❌ Database connection lost', {
            type: 'database',
            error: error?.message
        });
    }
};

export const apiLogger = {
    request: (method, url, ip = 'unknown', userId = null) => {
        logger.info(`${method} ${url} from ${ip}`, {
            type: 'api',
            method,
            url,
            ip,
            userId
        });
    },

    response: (method, url, statusCode, responseTime) => {
        logger.info(`${method} ${url} - ${statusCode} (${responseTime}ms)`, {
            type: 'api',
            method,
            url,
            statusCode,
            responseTime
        });
    },

    error: (method, url, error) => {
        logger.error(`API Error: ${method} ${url} - ${error.message}`, {
            type: 'api',
            method,
            url,
            error: error.message,
            stack: error.stack
        });
    }
};

export const securityLogger = {
    sqlInjectionAttempt: (query, params, ip) => {
        logger.warn(`⚠️ Possible SQL injection attempt from ${ip}`, {
            type: 'security',
            threat: 'sql_injection',
            query,
            params,
            ip
        });
    },

    xssAttempt: (field, value, ip) => {
        logger.warn(`⚠️ Possible XSS attempt from ${ip}`, {
            type: 'security',
            threat: 'xss',
            field,
            value,
            ip
        });
    },

    rateLimitExceeded: (ip, endpoint) => {
        logger.warn(`⚠️ Rate limit exceeded from ${ip} on ${endpoint}`, {
            type: 'security',
            threat: 'rate_limit',
            ip,
            endpoint
        });
    },

    corsBlocked: (origin) => {
        logger.warn(`🚫 CORS blocked request from ${origin}`, {
            type: 'security',
            threat: 'cors_violation',
            origin
        });
    },

    suspiciousActivity: (description, data) => {
        logger.warn(`⚠️ Suspicious activity: ${description}`, {
            type: 'security',
            threat: 'suspicious',
            ...data
        });
    }
};

export const businessLogger = {
    orderCreated: (orderId, userId, serviceType) => {
        logger.info(`📦 New order created: #${orderId}`, {
            type: 'business',
            action: 'order_created',
            orderId,
            userId,
            serviceType
        });
    },

    orderUpdated: (orderId, oldStatus, newStatus, adminId) => {
        logger.info(`📝 Order #${orderId} updated: ${oldStatus} → ${newStatus}`, {
            type: 'business',
            action: 'order_updated',
            orderId,
            oldStatus,
            newStatus,
            adminId
        });
    },

    orderDeleted: (orderId, adminId) => {
        logger.warn(`🗑️ Order #${orderId} deleted by admin #${adminId}`, {
            type: 'business',
            action: 'order_deleted',
            orderId,
            adminId
        });
    },

    reviewCreated: (reviewId, userName, rating) => {
        logger.info(`⭐ New review: #${reviewId} by ${userName} (${rating} stars)`, {
            type: 'business',
            action: 'review_created',
            reviewId,
            userName,
            rating
        });
    },

    reviewDeleted: (reviewId, adminId) => {
        logger.warn(`🗑️ Review #${reviewId} deleted by admin #${adminId}`, {
            type: 'business',
            action: 'review_deleted',
            reviewId,
            adminId
        });
    },

    adminCreated: (adminId, username, role, createdBy) => {
        logger.info(`👤 New admin created: ${username} (${role}) by admin #${createdBy}`, {
            type: 'business',
            action: 'admin_created',
            adminId,
            username,
            role,
            createdBy
        });
    },

    adminUpdated: (adminId, username, updatedBy) => {
        logger.info(`👤 Admin ${username} updated by admin #${updatedBy}`, {
            type: 'business',
            action: 'admin_updated',
            adminId,
            username,
            updatedBy
        });
    },

    adminDeleted: (adminId, username, deletedBy) => {
        logger.warn(`🗑️ Admin ${username} deleted by admin #${deletedBy}`, {
            type: 'business',
            action: 'admin_deleted',
            adminId,
            username,
            deletedBy
        });
    }
};

// Экспортируем основной логгер
export default logger;
