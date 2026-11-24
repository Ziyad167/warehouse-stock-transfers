const express = require('express');
const itemController = require('../controllers/items');
const inventoryController = require('../controllers/inventory');
const { requireLogin, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireLogin, itemController.listItems);
router.post('/', requireLogin, requireRole('manager'), itemController.createItem);
router.get('/:id/stock', requireLogin, inventoryController.listItemStock);

module.exports = router;