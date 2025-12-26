// middleware/security.js

/**
 * Input sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        return str.trim()
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<[^>]*>/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    };

    const sanitizeObject = (obj) => {
        if (obj === null || typeof obj !== 'object') return obj;

        if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        }

        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = sanitizeString(value);
            } else if (typeof value === 'object') {
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    };

    if (req.body) {
        req.body = sanitizeObject(req.body);
    }

    if (req.query) {
        req.query = sanitizeObject(req.query);
    }

    if (req.params) {
        req.params = sanitizeObject(req.params);
    }

    next();
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();

    // Log request
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);

    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    });

    next();
};

/**
 * Validate required fields middleware
 */
const validateRequiredFields = (requiredFields) => {
    return (req, res, next) => {
        const missingFields = [];

        requiredFields.forEach(field => {
            if (!req.body[field] || req.body[field].toString().trim() === '') {
                missingFields.push(field);
            }
        });

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                missingFields
            });
        }

        next();
    };
};

module.exports = {
    sanitizeInput,
    requestLogger,
    validateRequiredFields
};