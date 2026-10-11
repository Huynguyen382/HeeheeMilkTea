const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');
const DIST_DIR = path.join(PUBLIC_DIR, 'dist');

async function buildFrontendBundles() {
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // 1. Bundle & minify all main game frontend JS modules into a single file without source maps
  await esbuild.build({
    entryPoints: [path.join(PUBLIC_DIR, 'js', 'app.js')],
    bundle: true,
    minify: true,
    sourcemap: false,
    legalComments: 'none',
    target: ['es2020'],
    charset: 'utf8',
    outfile: path.join(DIST_DIR, 'game.min.js'),
  });

  // 2. Bundle & minify all main game CSS stylesheets into a single file without source maps
  const cssEntryContent = [
    '@import "../css/style.css";',
    '@import "../css/room.css";',
    '@import "../css/farm.css";',
    '@import "../css/franchise.css";',
    '@import "../css/staff.css";',
    '@import "../css/coffee.css";'
  ].join('\n');

  await esbuild.build({
    stdin: {
      contents: cssEntryContent,
      resolveDir: DIST_DIR,
      loader: 'css',
    },
    bundle: true,
    minify: true,
    sourcemap: false,
    legalComments: 'none',
    charset: 'utf8',
    external: ['https://*', 'http://*', 'data:*'],
    outfile: path.join(DIST_DIR, 'game.min.css'),
  });

  // 3. Bundle & minify Admin JS & CSS without source maps
  const adminJsPath = path.join(PUBLIC_DIR, 'js', 'admin.js');
  if (fs.existsSync(adminJsPath)) {
    await esbuild.build({
      entryPoints: [adminJsPath],
      bundle: true,
      minify: true,
      sourcemap: false,
      legalComments: 'none',
      target: ['es2020'],
      charset: 'utf8',
      outfile: path.join(DIST_DIR, 'admin.min.js'),
    });
  }

  const adminCssPath = path.join(PUBLIC_DIR, 'css', 'admin.css');
  if (fs.existsSync(adminCssPath)) {
    await esbuild.build({
      entryPoints: [adminCssPath],
      bundle: true,
      minify: true,
      sourcemap: false,
      legalComments: 'none',
      charset: 'utf8',
      external: ['https://*', 'http://*', 'data:*'],
      outfile: path.join(DIST_DIR, 'admin.min.css'),
    });
  }

  console.log('[Build] Bundled & minified frontend assets into public/dist/ (sourcemap: false)');
}

if (require.main === module) {
  buildFrontendBundles().catch((err) => {
    console.error('[Build] Failed to bundle frontend:', err);
    process.exit(1);
  });
}

module.exports = { buildFrontendBundles };

