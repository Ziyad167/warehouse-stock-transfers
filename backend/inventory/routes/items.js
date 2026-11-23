const express = require('express');
const itemController = require('../controllers/items');

const router = express.Router();

router.get('/', itemController.listItems);
router.post('/', itemController.createItem);

module.exports = router;