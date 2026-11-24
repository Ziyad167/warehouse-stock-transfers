const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const itemService = require('./itemService');
const warehouseService = require('./warehouseService');

// Lab 8: Amazon SNS on Floci sends the low-stock alerts.
// All the settings come from the .env file.
const sns = new SNSClient({
  endpoint: process.env.AWS_ENDPOINT,
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const LOW_STOCK_LIMIT = Number(process.env.LOW_STOCK_LIMIT) || 10;

// Business rule: after a stock change, if the quantity is below the limit,
// publish a "low stock" message to the SNS topic so managers can restock in time.
// Returns true if an alert was sent.
async function sendLowStockAlert(record) {
  if (record.quantity >= LOW_STOCK_LIMIT) {
    return false;
  }

  const item = await itemService.findItemById(record.itemId);
  const warehouse = await warehouseService.findWarehouseById(record.warehouseId);
  const message = `Low stock: ${item.name} (${item.sku}) in ${warehouse.name} ` +
    `has only ${record.quantity} left. The limit is ${LOW_STOCK_LIMIT}.`;

  try {
    await sns.send(new PublishCommand({
      TopicArn: process.env.LOW_STOCK_TOPIC_ARN,
      Subject: 'Low stock alert',
      Message: message
    }));
    return true;
  } catch (error) {
    // The stock update already worked, so a failed alert must not break it
    console.warn(`Low stock alert failed: ${error.message}`);
    return false;
  }
}

module.exports = { sendLowStockAlert };