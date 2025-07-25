/**
 * Parses VCB account transfer notifications.
 * Format: "Số dư TK VCB ... -1,270 VND ..."
 * @param {string} message The notification content.
 * @returns {object|null} Parsed data or null if it doesn't match.
 */
function parseVcbAccountTransfer(message) {
  // Số dư TK VCB 0541000346532 -1,000 VND lúc 17-07-2025 13:52:49. Số dư 319,000 VND. Ref MBVCB.10226218427.BUI THANH XUAN chuyen tien.CT tu 0541000346532 BUI THANH XUAN toi 9963595567 TRAN THU UYEN"
  // Số dư TK VCB 0541000346532 +20,270 VND lúc 17-07-2025 13:55:18. Số dư 339,270 VND. Ref MBVCB.10226239116.TRAN THU UYEN chuyen tien.CT tu 9963595567 TRAN THU UYEN toi 0541000346532 BUI THANH XUAN"
  const regex = /(?<account>TK VCB \d+)\s(?<sign>[+-])(?<amount>[\d,]+)\s+VND.*?Ref\s(?<ref>.*?)\.(?<transaction>.*?)\.(?<details>.*)/;
  const match = regex.exec(message);

  if (!match) {
    return null; // Not an account transfer format
  }

  const { groups } = match;
  const type = groups.sign === '+' ? 'Income' : 'Expense';
  let amount = parseInt(groups.amount.replace(/,/g, ''), 10);

  if (type === 'Expense') {
    amount = -amount;
  }

  return {
    amount,
    type,
    transaction: groups.transaction.trim() || 'VCB Account Transfer',
    notes: `Ref ${groups.ref.trim()}. ${groups.transaction.trim()}. ${groups.details.trim()}`,
    paymentMethod: 'VCB Account',
    category: 'Utilities',
  };
}

/**
 * Parses VCB credit card transaction notifications.
 * Format: "Thẻ VCB Visa ... sử dụng tại ... số tiền ... USD ..."
 * @param {string} message The notification content.
 * @returns {object|null} Parsed data or null if it doesn't match.
 */
function parseVcbCreditCard(message) {
  const regex = /Thẻ (?<cardInfo>VCB .*?\d{4}) sử dụng tại (?<merchant>.*?) số tiền (?<amount>[\d,]+)\s+(?<currency>\w+)/;
  const match = regex.exec(message);

  if (!match) {
    return null; // Not a credit card transaction format
  }

  const { groups } = match;

  // Card transactions are always expenses
  const type = 'Expense';
  let amount = -parseInt(groups.amount.replace(/,/g, ''), 10);

  // Note: If the currency is not VND, you might want to add a conversion step later.
  // For now, we record the original amount and currency.
  const transaction = groups.merchant.trim();
  const notes = `Payment with ${groups.cardInfo.trim()}. Original amount: ${groups.amount} ${groups.currency}.`;

  return {
    amount,
    type,
    transaction,
    notes,
    paymentMethod: 'VCB Card',
    category: 'Utilities',
  };
}


/**
 * Main dispatcher for VCB notifications.
 * It tries each specific parser in order until one succeeds.
 * This ensures only known formats are processed.
 * @param {string} message The raw notification message from VCB.
 * @returns {object|null} The parsed data, or null if no format matched.
 */
function parseVCBNotification(message) {
  // Array of parser functions to try in order.
  const parsers = [
    parseVcbAccountTransfer,
    parseVcbCreditCard
    // Add future VCB format parsers here.
  ];

  for (const parser of parsers) {
    const result = parser(message);
    if (result) {
      console.log(`VCB message matched with parser: ${parser.name}`);
      return result; // Success! Return the parsed data.
    }
  }

  // If the loop finishes, no parser matched the format.
  console.warn('VCB message did not match any known format:', message);
  return null; // Fulfill the requirement to fail on unknown formats.
}


// --- The rest of the file remains unchanged ---

// Map package names to their corresponding main dispatcher.
const notificationParsers = {
  'com.VCB': parseVCBNotification,
};

/**
 * Parses a notification based on package name.
 * @param {string} pkg The package name (e.g., "com.VCB").
 * @param {string} text The notification content.
 * @returns {object|null} The parsed data or null if no parser is found.
 */
function parseNotification(pkg, text) {
  const parser = notificationParsers[pkg];
  if (parser) {
    return parser(text);
  }
  console.warn('No parser found for package:', pkg);
  return null;
}

module.exports = { parseNotification };
