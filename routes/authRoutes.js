const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// User Sign-In Route
router.post('/signin', async (req, res) => {
    const { identifier, password } = req.body;

    try {
        const user = await User.findOne({
            $or: [{ email: identifier }, { name: identifier }], // Allow login via email or username
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Compare provided password with hashed password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT with userId and role
        const token = jwt.sign(
            { userId: user._id, role: user.role }, // Ensure role is included in JWT
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Respond with JWT token and role
        res.status(200).json({
            token,
            role: user.role,
        });
    } catch (error) {
        console.error('Error signing in:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
