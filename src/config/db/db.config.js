const {
  keepalives,
  idleTimeoutMillis,
  connectionString,
} = require("pg/lib/defaults");

require("dotenv").config();

module.exports = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl:
    process.env.DB_HOST === "localhost" ? false : { rejectUnauthorized: false },
  keepAlive: true,
  idleTimeoutMillis: 30000,
  connectionTimeotMillis: 10000,
};
