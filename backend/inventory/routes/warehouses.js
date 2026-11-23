const express = require('express');
const warehouseController = require('../controllers/warehouses');

const router = express.Router();

router.get('/', warehouseController.listWarehouses);
router.post('/', warehouseController.createWarehouse);

module.exports = router;