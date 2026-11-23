const itemService = require('../services/itemService');

const SKU_PATTERN = /^[A-Za-z0-9-]{3,30}$/;

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

function checkText(value, label, min, max) {
  if (typeof value !== 'string') {
    return `${label} is required.`;
  }
  const length = value.trim().length;
  if (length < min || length > max) {
    return `${label} must contain between ${min} and ${max} characters.`;
  }
  return null;
}
function validateNewItem(name, sku, category, description) {
  const textProblem = checkText(name, 'Name', 2, 100) ||
    checkText(category, 'Category', 2, 50);
  if (textProblem) return textProblem;

  if (typeof sku !== 'string' || !SKU_PATTERN.test(sku.trim())) {
    return 'SKU is required and must be 3 to 30 letters, numbers or dashes.';
  }
  if (description !== undefined &&
      (typeof description !== 'string' || description.length > 500)) {
    return 'Description must be text of at most 500 characters.';
  }
  return null;
}
async function listItems(req, res, next) {
  try {
    const items = await itemService.searchItems(req.query.search);
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
}
async function createItem(req, res, next) {
  try {
    if (!req.is('application/json')) {
      return sendError(res, 415, 'UNSUPPORTED_MEDIA_TYPE',
        'Content-Type must be application/json.');
    }

    const { name, sku, category, description } = req.body;

    const problem = validateNewItem(name, sku, category, description);
    if (problem) {
      return sendError(res, 400, 'VALIDATION_ERROR', problem);
    }

    const existing = await itemService.findItemBySku(sku);
    if (existing) {
      return sendError(res, 409, 'DUPLICATE_SKU',
        `An item with SKU ${existing.sku} already exists.`);
    }

    const item = await itemService.createItem({ name, sku, category, description });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}
module.exports = {
  listItems,
  createItem
};