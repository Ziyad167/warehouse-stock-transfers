const fs = require('fs/promises');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'items.json');

async function readItems() {
  const text = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(text);
}

async function writeItems(items) {
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2) + '\n');
}
async function findItemBySku(sku) {
  const items = await readItems();
  const wanted = sku.trim().toUpperCase();
  return items.find((item) => item.sku === wanted);
}

async function searchItems(searchText) {
  const items = await readItems();
  const text = (searchText || '').trim().toLowerCase();
  if (text === '') {
    return items;
  }
  return items.filter((item) =>
    item.name.toLowerCase().includes(text) ||
    item.sku.toLowerCase().includes(text) ||
    item.category.toLowerCase().includes(text)
  );
}
async function createItem({ name, sku, category, description }) {
  const items = await readItems();
  const item = {
    itemId: `ITM-${Date.now()}`,
    name: name.trim(),
    sku: sku.trim().toUpperCase(),
    category: category.trim(),
    description: (description || '').trim(),
    createdAt: new Date().toISOString()
  };
  items.push(item);
  await writeItems(items);
  return item;
}
module.exports = { readItems, findItemBySku, searchItems, createItem };