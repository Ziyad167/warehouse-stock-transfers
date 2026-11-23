const express = require('express');
const itemController = require('../controllers/items');
const { requireLogin, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireLogin, itemController.listItems);
router.post('/', requireLogin, requireRole('manager'), itemController.createItem);

module.exports = router;