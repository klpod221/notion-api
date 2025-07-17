require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  auth: {
    user: process.env.BASIC_AUTH_USER,
    pass: process.env.BASIC_AUTH_PASS,
  },
  notion: {
    apiKey: process.env.NOTION_API_KEY,
    databaseId: process.env.NOTION_DATABASE_ID,
    apiUrl: 'https://api.notion.com/v1/pages',
    apiVersion: '2022-06-28',
  },
  db: {
    filename: process.env.DB_FILENAME || 'requests.db',
  },
};
