
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // Read token from Authorization header
    const authHeader = req.headers.authorization;

    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    try {
        // Verify JWT signature and expiry
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Store authenticated user's information
        req.user = decoded;

        next();

    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

module.exports = authenticateToken;
