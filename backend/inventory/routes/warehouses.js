const express = require('express');
const warehouseController = require('../controllers/warehouses');
const inventoryController = require('../controllers/inventory');

const router = express.Router();

router.get('/', warehouseController.listWarehouses);
router.post('/', warehouseController.createWarehouse);
router.get('/:id/inventory', inventoryController.listWarehouseInventory);

module.exports = router;