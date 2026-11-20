/**
 * Unified Database Module
 * Re-exports the primary tuned database instance from server/models/db.js
 * to prevent duplicate connection pools, schema divergence, and memory leaks.
 */

const db = require('./models/db');

module.exports = db;
