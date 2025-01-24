const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log('Decoded Token:', decoded);
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Session expired. Please log in again.' });
        }
        res.status(401).json({ message: 'Token is not valid' });
    }
};


// Admin Middleware (restrict access to only admin users)
const adminMiddleware = (req, res, next) => {
    console.log('Admin Middleware Triggered');
    console.log('Checking Admin Role:', req.user.role); // Debugging log
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied, admin only' });
    }
    next();
};

// Driver Middleware (restrict access to only driver users)
const driverMiddleware = (req, res, next) => {
    console.log('Checking Driver Role:', req.user.role); // Debugging log
    if (req.user.role !== 'driver') {
        return res.status(403).json({ message: 'Access denied, driver only' });
    }
    next();
};

module.exports = {
    authMiddleware,
    adminMiddleware,
    driverMiddleware,
};
