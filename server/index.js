const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const promClient = require('prom-client');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const certDir = path.join('C:', 'inetpub', 'alignos', 'certs');
const isProd = fs.existsSync(certDir);

console.log("Environment:", isProd ? "PRODUCTION" : "DEVELOPMENT");


const app = express();
// Default metrics (CPU, memory, event loop lag, etc.)
promClient.collectDefaultMetrics();

// Custom metrics (you can add more later)
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2]
});

// Middleware to measure request duration
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.path, status: res.statusCode });
  });
  next();
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

app.listen(8080, () => console.log('Prometheus Server running on 8080'));




const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alignos';


app.set('trust proxy', true);
// Create Umami proxy middleware ONCE (not on every request)
// This proxies /stats/* to Umami running on localhost:3000
const umamiProxy = createProxyMiddleware({
  target: 'http://localhost:3001',  // ← change back to 3001 (the exposed/mapped port)
  changeOrigin: true,
  pathRewrite: { '^/stats': '' },
  logLevel: 'debug',
  secure: false,
  proxyTimeout: 300000,  // 5 minutes
  timeout: 300000,
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setTimeout(300000);
    console.log('[UMAMI PROXY REQ] Method:', req.method, 'Path:', req.path, 'Headers:', req.headers);
    // If body is parsed, log it (requires body-parser middleware earlier in app)
    if (req.body) console.log('[UMAMI PROXY REQ] Body:', JSON.stringify(req.body));
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('[UMAMI PROXY RES] Status:', proxyRes.statusCode, proxyRes.statusMessage, 'for', req.path);
    console.log('[UMAMI PROXY RES] Headers:', proxyRes.headers);
  },
  onError: (err, req, res) => {
    console.error('[UMAMI PROXY ERROR FULL]', err.message, err.code, err.stack || err);
    if (!res.headersSent) res.status(502).send('Umami proxy failed - check logs');
  }
});

// Use the proxy for production, return empty responses for dev
app.use('/stats', (req, res, next) => {
  if (isProd) {

    console.log('[UMAMI PROXY] Handling request:', req.method, req.path);
    umamiProxy(req, res, next);
  } else {
    // Dev mode - return empty responses
    if (req.path === '/script.js') {
      console.log('[UMAMI PROXY] Dev mode - returning empty script');
      res.setHeader('Content-Type', 'text/javascript');
      res.send('');
    } else {
      console.log('[UMAMI PROXY] Dev mode - ignoring analytics event');
      res.status(200).json({});
    }
  }
});
// Middleware
app.use(cors());
app.use(express.json());
// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});


// Database Connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Serve static files from Vue build (but NOT /api routes)
const clientPath = path.join(__dirname, '../client/dist');
const staticMiddleware = express.static(clientPath, {
  maxAge: '1d', // Cache static assets for 1 day
  etag: true,
  index: false // Don't serve index.html automatically for directories
});

// API Routes (prefix with /api to distinguish from static files)
app.get('/api/health', (req, res) => {
  console.log('[API] Health endpoint HIT!');
  res.json({
    status: 'ok',
    message: 'AlignOS API is running',
    timestamp: new Date().toISOString()
  });
});

// Full lattice - complete content of all 133 codexes (~827KB)
app.get('/api/codex-lattice', (req, res) => {
  console.log('[API] Codex-lattice endpoint HIT!');
  try {
    const filePath = path.join(__dirname, '../client/src/generated/codex-lattice.json');
    console.log('[API] Reading codex-lattice from:', filePath);
    const data = fs.readFileSync(filePath, 'utf-8');
    console.log('[API] File read successfully, length:', data.length);
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
    console.log('[API] Response sent');
  } catch (error) {
    console.error('[API] Error:', error);
    res.status(500).json({ error: 'Failed to read lattice file', message: error.message });
  }
});

// Metadata only - lightweight index (~32KB)
app.get('/api/codex-lattice-meta', (req, res) => {
  console.log('[API HANDLER] /api/codex-lattice-meta route HIT!');
  try {
    const filePath = path.join(__dirname, '../client/src/generated/codex-lattice-meta.json');
    console.log('[API] Reading codex-lattice-meta from:', filePath);
    const data = fs.readFileSync(filePath, 'utf-8');
    console.log('[API] Metadata file read successfully, length:', data.length);
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
    console.log('[API] Metadata response sent');
  } catch (error) {
    console.error('[API] Metadata error:', error);
    res.status(500).json({ error: 'Failed to read metadata file', message: error.message });
  }
});



// Individual codex content by ID
app.get('/api/codex/:id', (req, res) => {
  console.log('[API] Codex by ID endpoint HIT! ID:', req.params.id);
  try {
    const latticeData = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../client/src/generated/codex-lattice.json'),
        'utf-8'
      )
    );
    const codex = latticeData.find(c => c.id === req.params.id);

    if (codex) {
      console.log('[API] Found codex:', codex.title);
      res.json(codex);
    } else {
      console.log('[API] Codex not found for ID:', req.params.id);
      res.status(404).json({
        error: 'Codex not found',
        suggestion: 'Browse available codexes at /api/codex-lattice-meta',
        requested_id: req.params.id
      });
    }
  } catch (error) {
    console.error('Error loading codex data:', error);
    res.status(500).json({
      error: 'Failed to load codex data',
      message: error.message
    });
  }
});

// Apply static middleware only to non-API routes
app.use((req, res, next) => {
  // Skip static file serving for API routes - don't even call the static middleware
  if (req.path.startsWith('/api/')) {
    console.log('[STATIC GUARD] Skipping static middleware for API route:', req.path);
    return next();
  }
  // For non-API routes, call the static middleware
  console.log('[STATIC GUARD] Passing to static middleware:', req.path);
  staticMiddleware(req, res, next);
});

// Serve prerendered .html files for clean URLs (e.g., /about → about.html)
// This middleware is ONLY for HTML pages, not API routes or static assets
app.use((req, res, next) => {
  console.log('[HTML CHECK] Checking path:', req.path);

  // NEVER interfere with API routes - they serve JSON only
  if (req.path.startsWith('/api/')) {
    console.log('[HTML CHECK] Skipping API route');
    return next();
  }

  // Skip if path already has an extension (like /llms.json, /assets/app.js)
  // Static middleware already handled these
  if (path.extname(req.path)) {
    console.log('[HTML CHECK] Skipping - path has extension');
    return next();
  }

  // Skip if we already sent a response (static file was served)
  if (res.headersSent) {
    console.log('[HTML CHECK] Skipping - headers already sent');
    return next();
  }

  // Try appending .html to the path
  const htmlPath = path.join(clientPath, `${req.path}.html`);

  // Check if the .html file exists
  fs.access(htmlPath, fs.constants.F_OK, (err) => {
    if (err) {
      // .html file doesn't exist, let SPA fallback handle it
      console.log('[HTML CHECK] No .html file found, passing to SPA fallback');
      return next();
    }

    // .html file exists! Serve the prerendered page
    console.log('[HTML CHECK] ✅ Serving prerendered HTML:', req.path);
    res.sendFile(htmlPath);
  });
});

// Serve .well-known directory for ACME certificate verification
app.use('/.well-known', express.static(path.join(__dirname, '../client/public/.well-known'), {
  maxAge: 0, // No caching for ACME challenges
  dotfiles: 'allow'
}));

// SPA fallback - serve index.html for all non-API, non-static routes
// This allows Vue Router to handle client-side routing
app.use((req, res, next) => {
  console.log('[FALLBACK] Checking path:', req.path);

  // Skip SPA fallback for API routes (double-check)
  if (req.path.startsWith('/api/')) {
    console.log('[FALLBACK] Skipping API route:', req.path);
    return next();
  }

  // Skip if we already sent a response (static file was found)
  if (res.headersSent) {
    console.log('[FALLBACK] Headers already sent, skipping');
    return next();
  }

  console.log('[FALLBACK] Serving index.html for:', req.path);
  // Serve index.html for all other routes
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving static files from: ${clientPath}`);
  console.log(`\nAPI Routes Available:`);
  console.log(`  - http://localhost:${PORT}/api/health`);
  console.log(`  - http://localhost:${PORT}/api/codex-lattice`);
  console.log(`  - http://localhost:${PORT}/api/codex-lattice-meta`);
  console.log(`  - http://localhost:${PORT}/api/codex/:id`);
  console.log(`\nDiscovery File:`);
  console.log(`  - http://localhost:${PORT}/llms.json`);
  console.log(`\nAccess URLs:`);
  console.log(`  Local:    http://localhost:${PORT}`);
  console.log(`  Network:  http://192.168.50.209:${PORT}`);
  console.log(`  WAN:      https://alignos.cosmiccreation.net:${PORT}`);
});
