const express = require('express');
const router = express.Router();
const { register, login, getUserProfile, changePassword, updateProfile, refreshToken, logout } = require('../controller/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.get('/profile', protect, getUserProfile);
router.put('/change-password', protect, changePassword);
router.put('/update-profile', protect, updateProfile);

module.exports = router;
