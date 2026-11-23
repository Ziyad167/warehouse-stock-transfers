const fs = require('fs/promises');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'inventory.json');

// Reads the whole file and returns the array of inventory records
async function readInventory() {
  const text = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(text);
}

// Saves the whole array of inventory records back to the file
async function writeInventory(records) {
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2) + '\n');
}

// Finds the record of one item in one warehouse; returns it or undefined
async function findRecord(warehouseId, itemId) {
  const records = await readInventory();
  return records.find((record) =>
    record.warehouseId === warehouseId && record.itemId === itemId
  );
}

// Returns all the inventory records of one warehouse
async function listByWarehouse(warehouseId) {
  const records = await readInventory();
  return records.filter((record) => record.warehouseId === warehouseId);
}

// Builds a new record, adds it to the list, saves the list, returns the new record
async function createRecord({ warehouseId, itemId, quantity }) {
  const records = await readInventory();
  const record = {
    inventoryId: `INV-${Date.now()}`,
    warehouseId,
    itemId,
    quantity,
    updatedAt: new Date().toISOString()
  };
  records.push(record);
  await writeInventory(records);
  return record;
}

module.exports = { readInventory, findRecord, listByWarehouse, createRecord };