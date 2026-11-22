/**
 * Production-ready compression middleware using standard 'compression' package.
 * Efficiently handles streaming, backpressure, Brotli, and Gzip.
 * Reduces bandwidth and memory overhead on Render Free Tier without hanging static asset streams.
 */

const compression = require('compression');

function compressionMiddleware(options = {}) {
  const threshold = options.threshold || 512;

  return compression({
    threshold,
    filter: (req, res) => {
      // Skip Server-Sent Events (SSE) or WebSocket upgrades
      if (
        req.headers['accept'] === 'text/event-stream' ||
        req.path.includes('live-stream') ||
        req.path.includes('/events')
      ) {
        return false;
      }
      return compression.filter(req, res);
    }
  });
}

module.exports = { compressionMiddleware };
