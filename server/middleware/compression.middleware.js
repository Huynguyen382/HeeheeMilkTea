/**
 * Lightweight native Gzip/Deflate compression middleware using Node's built-in zlib.
 * Zero external dependencies.
 * Reduces bandwidth and memory overhead on Render Free Tier.
 */

const zlib = require('zlib');

function compressionMiddleware(options = {}) {
  const minLength = options.threshold || 512;

  return function compression(req, res, next) {
    const acceptEncoding = req.headers['accept-encoding'] || '';

    // Skip Server-Sent Events (SSE) or WebSocket upgrades
    if (
      req.headers['accept'] === 'text/event-stream' ||
      req.path.includes('live-stream') ||
      req.path.includes('/events')
    ) {
      return next();
    }

    let method = null;
    if (acceptEncoding.includes('gzip')) {
      method = 'gzip';
    } else if (acceptEncoding.includes('deflate')) {
      method = 'deflate';
    }

    if (!method) {
      return next();
    }

    const _write = res.write;
    const _end = res.end;
    let compressStream = null;
    let shouldCompress = true;

    function initCompressor() {
      if (compressStream) return;
      res.setHeader('Content-Encoding', method);
      res.removeHeader('Content-Length');
      res.setHeader('Vary', 'Accept-Encoding');

      compressStream =
        method === 'gzip'
          ? zlib.createGzip({ level: 6 })
          : zlib.createDeflate({ level: 6 });

      compressStream.on('data', (chunk) => _write.call(res, chunk));
      compressStream.on('end', () => _end.call(res));
    }

    res.write = function (chunk, encoding, callback) {
      const type = res.getHeader('Content-Type') || '';
      if (
        typeof type === 'string' &&
        (type.includes('image/') ||
          type.includes('audio/') ||
          type.includes('video/') ||
          type.includes('text/event-stream'))
      ) {
        shouldCompress = false;
      }

      if (!shouldCompress) {
        return _write.call(res, chunk, encoding, callback);
      }

      initCompressor();
      return compressStream.write(chunk, encoding, callback);
    };

    res.end = function (chunk, encoding, callback) {
      const type = res.getHeader('Content-Type') || '';
      if (
        typeof type === 'string' &&
        (type.includes('image/') ||
          type.includes('audio/') ||
          type.includes('video/') ||
          type.includes('text/event-stream'))
      ) {
        shouldCompress = false;
      }

      if (!shouldCompress) {
        return _end.call(res, chunk, encoding, callback);
      }

      if (chunk) {
        if (!compressStream && Buffer.byteLength(chunk, encoding) < minLength) {
          return _end.call(res, chunk, encoding, callback);
        }
        initCompressor();
        compressStream.end(chunk, encoding, callback);
      } else if (compressStream) {
        compressStream.end();
      } else {
        _end.call(res, callback);
      }
    };

    next();
  };
}

module.exports = { compressionMiddleware };
