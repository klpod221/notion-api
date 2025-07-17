const config = require('../config');

// Use object lookup instead of if/else
const ICONS = {
  Income: '📈',
  Expense: '💸',
  Default: '📄',
};

/**
 * Creates a new transaction page in Notion.
 * @param {object} data - Processed transaction data.
 * @param {Date} date - Transaction Date object.
 * @returns {Promise<object>} Response data from Notion API.
 * @throws {Error} Throws error if Notion API returns a non-ok response.
 */
async function createTransactionPage(data, date) {
  const { notion } = config;

  const payload = {
    parent: { database_id: notion.databaseId },
    icon: {
      type: 'emoji',
      emoji: ICONS[data.type] || ICONS.Default,
    },
    properties: {
      Transaction: { title: [{ text: { content: data.transaction } }] },
      Amount: { number: data.amount },
      Date: { date: { start: date.toISOString() } },
      Category: { select: { name: data.category } },
      Type: { select: { name: data.type } },
      'Payment Method': { select: { name: data.paymentMethod } },
      Notes: { rich_text: [{ text: { content: data.notes } }] },
    },
  };

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${notion.apiKey}`,
      'Notion-Version': notion.apiVersion,
    },
    body: JSON.stringify(payload),
  };

  console.log('Sending data to Notion...');
  const response = await fetch(notion.apiUrl, options);

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(`Notion API Error (${response.status}): ${JSON.stringify(errorBody)}`);
  }

  return response.json();
}

module.exports = { createTransactionPage };
