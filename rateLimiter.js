// ==================== RATE LIMITING CONFIGURATION ====================
import rateLimit from 'express-rate-limit';
import { securityLogger } from './logger.js';

// Функция для получения IP адреса
const getIp = (req) => {
    return req.headers['x-forwarded-for'] ||
           req.headers['x-real-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           req.ip;
};

// Обработчик превышения лимита с логированием
const rateLimitHandler = (req, res) => {
    const ip = getIp(req);
    const endpoint = req.path;

    securityLogger.rateLimitExceeded(ip, endpoint);

    res.status(429).json({
        success: false,
        message: '⚠️ Juda ko\'p so\'rov! Iltimos, biroz kuting.',
        error: 'Too many requests',
        retryAfter: res.getHeader('Retry-After')
    });
};

// Функция пропуска лимита (для whitelist)
const skipRateLimit = (req) => {
    // Можно добавить IP whitelist
    const whitelistedIPs = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
    const ip = getIp(req);
    return whitelistedIPs.includes(ip);
};

// ========== 1. СТРОГИЙ ЛИМИТ ДЛЯ ЛОГИНА ==========
// Защита от брутфорс атак на админ-панель
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 5, // 5 попыток за 15 минут
    message: '🔒 Juda ko\'p kirish urinishlari! 15 daqiqa kuting.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: rateLimitHandler,
    skip: skipRateLimit,
    keyGenerator: (req) => {
        // Используем комбинацию IP + username для более точного ограничения
        const ip = getIp(req);
        const username = req.body?.username || 'unknown';
        return `${ip}:${username}`;
    }
});

// ========== 2. СРЕДНИЙ ЛИМИТ ДЛЯ ПУБЛИЧНЫХ API ==========
// Защита от спама заказов и отзывов
export const publicApiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 минут
    max: 20, // 20 запросов за 10 минут
    message: '⚠️ Juda ko\'p so\'rov! Iltimos, 10 daqiqa kuting.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    skip: skipRateLimit,
    keyGenerator: (req) => getIp(req)
});

// ========== 3. ЛИМИТ ДЛЯ СОЗДАНИЯ ЗАКАЗОВ ==========
// Более строгий лимит для предотвращения спама заказами
export const orderCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 час
    max: 10, // 10 заказов в час с одного IP
    message: '🛑 Juda ko\'p buyurtma! Iltimos, 1 soat kuting.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    skip: skipRateLimit,
    keyGenerator: (req) => {
        const ip = getIp(req);
        const phone = req.body?.phone || 'unknown';
        return `${ip}:${phone}`;
    }
});

// ========== 4. ЛИМИТ ДЛЯ СОЗДАНИЯ ОТЗЫВОВ ==========
// Защита от спама отзывами
export const reviewCreationLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 часа
    max: 3, // 3 отзыва в день с одного IP
    message: '⭐ Juda ko\'p fikr! Iltimos, ertaga qaytib keling.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    skip: skipRateLimit,
    keyGenerator: (req) => getIp(req)
});

// ========== 5. ОБЩИЙ ЛИМИТ ДЛЯ ADMIN API ==========
// Защита админ-панели от DDoS
export const adminApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // 100 запросов за 15 минут
    message: '⚠️ Juda ko\'p admin so\'rovlar!',
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    skip: skipRateLimit,
    keyGenerator: (req) => {
        // Используем admin ID если есть
        const ip = getIp(req);
        const adminId = req.adminId || 'unknown';
        return `admin:${ip}:${adminId}`;
    }
});

// ========== 6. ЛИМИТ ДЛЯ СОЗДАНИЯ АДМИНОВ ==========
// Очень строгий лимит для критичных операций
export const adminCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 час
    max: 5, // 5 создания админов в час
    message: '🔐 Juda ko\'p admin yaratish urinishi!',
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    skip: skipRateLimit,
    keyGenerator: (req) => {
        const ip = getIp(req);
        const adminId = req.adminId || 'unknown';
        return `create-admin:${ip}:${adminId}`;
    }
});

// ========== 7. ГЛОБАЛЬНЫЙ МЯГКИЙ ЛИМИТ ==========
// Общая защита всего API
export const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 минута
    max: 60, // 60 запросов в минуту (1 запрос в секунду в среднем)
    message: '⚠️ Juda ko\'p so\'rov! Iltimos, sekinroq ishlating.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        const ip = getIp(req);
        securityLogger.rateLimitExceeded(ip, 'global');
        res.status(429).json({
            success: false,
            message: '⚠️ Too many requests from your IP. Please slow down.',
            error: 'Rate limit exceeded'
        });
    },
    skip: skipRateLimit,
    keyGenerator: (req) => getIp(req)
});

// Экспорт вспомогательной функции
export { getIp };
