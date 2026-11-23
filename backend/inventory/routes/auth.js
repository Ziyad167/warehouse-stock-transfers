const express = require('express');
const authController = require('../controllers/auth');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

router.post('/login', authController.login);
router.get('/me', requireLogin, authController.me);
router.post('/logout', requireLogin, authController.logout);

module.exports = router;