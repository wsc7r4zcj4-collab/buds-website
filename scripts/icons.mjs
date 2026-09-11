// Rasterises favicon.svg and scripts/og.html with headless Chrome/Brave.
// Run: node scripts/icons.mjs   (re-run after changing the SVG or the OG template)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const chrome = [
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell`,
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(existsSync);
if (!chrome) throw new Error('no Chrome/Brave found for rasterising');

const tmp = resolve(root, 'scripts/.tmp');
mkdirSync(tmp, { recursive: true });

function shot(url, w, h, out) {
  execFileSync(chrome, [
    '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--window-size=${w},${h}`, `--screenshot=${out}`, `--user-data-dir=${tmp}/profile`, `--virtual-time-budget=5000`, url,
  ], { stdio: 'ignore', timeout: 60000 });
}

const svg = `file://${root}/favicon.svg`;
for (const [name, size] of [['icon-512.png', 512], ['icon-192.png', 192], ['apple-touch-icon.png', 180], ['favicon-32.png', 32]]) {
  const html = `${tmp}/${size}.html`;
  execFileSync('sh', ['-c', `printf '%s' '<!doctype html><html><body style="margin:0;background:#000"><img src="${svg}" style="display:block;width:${size}px;height:${size}px"></body></html>' > "${html}"`]);
  shot(`file://${html}`, size, size, `${tmp}/${name}`);
  renameSync(`${tmp}/${name}`, resolve(root, name));
  console.log('wrote ' + name);
}

shot(`file://${root}/scripts/og.html`, 1200, 630, `${tmp}/og.png`);
execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '85', `${tmp}/og.png`, '--out', resolve(root, 'og.jpg')], { stdio: 'ignore' });
console.log('wrote og.jpg');
rmSync(tmp, { recursive: true, force: true });
