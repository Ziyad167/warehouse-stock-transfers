const fs = require('fs/promises');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'warehouses.json');


async function readWarehouses() {
  const text = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(text);
}


async function writeWarehouses(warehouses) {
  await fs.writeFile(DATA_FILE, JSON.stringify(warehouses, null, 2) + '\n');
}


async function createWarehouse({ name, location }) {
  const warehouses = await readWarehouses();
  const warehouse = {
    warehouseId: `WH-${Date.now()}`,
    name: name.trim(),
    location: location.trim(),
    createdAt: new Date().toISOString()
  };
  warehouses.push(warehouse);
  await writeWarehouses(warehouses);
  return warehouse;
}

module.exports = { readWarehouses, createWarehouse };
