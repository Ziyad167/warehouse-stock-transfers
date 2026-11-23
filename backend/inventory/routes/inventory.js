const express = require('express');
const inventoryController = require('../controllers/inventory');

const router = express.Router();

router.post('/', inventoryController.createInventoryRecord);

module.exports = router;