const express = require('express');
const basicAuth = require('basic-auth');
const config = require('./config');
const notionService = require('./services/notionService');
const notificationService = require('./services/notificationService');

const app = express();
app.use(express.json());

// --- Middlewares ---
function authMiddleware(req, res, next) {
  const user = basicAuth(req);
  if (!user || user.name !== config.auth.user || user.pass !== config.auth.pass) {
    res.set('WWW-Authenticate', 'Basic realm="401"');
    return res.status(401).send('Authentication required.');
  }
  next();
}

// --- Routes ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api', authMiddleware, async (req, res) => {
  try {
    const { package: pkg, text, time } = req.body;
    if (!pkg || !text || !time) {
        return res.status(400).json({ success: false, error: 'Missing package, text, or time in request body.' });
    }

    const parsedData = notificationService.parseNotification(pkg, text);

    if (!parsedData) {
      return res.status(400).json({ success: false, error: `Could not parse notification for package: ${pkg}` });
    }

    const transactionDate = new Date(parseInt(time, 10));
    const notionResult = await notionService.createTransactionPage(parsedData, transactionDate);
    console.log('Successfully created Notion page:', notionResult.id);

    res.status(201).json({
      success: true,
      message: 'Request processed and saved to Notion.',
      notionPageId: notionResult.id,
      parsedData,
    });
  } catch (error) {
    console.error('An error occurred in /api route:', error.message);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// --- Server Start ---
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
